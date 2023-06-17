import { DeleteObjectCommand, GetObjectCommand, S3 } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DeletionReason } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { createECDH } from 'crypto';
import { z } from 'zod';
import { env } from '~/env.mjs';
import { type FileTablePageData, type FileTablePageMetadata, type FileTablePageRow } from '~/utils/@types/FileTablePageData';
import { defaultAwsExpirationSeconds, eccCurveName, eccCurvePublicKeyLength, maxFileSizeInBytes } from '~/utils/constants';
import { getUserKeysWithGuard } from '~/utils/helpers/auth';
import { decrypt, encrypt } from '~/utils/helpers/encryption';
import { getHumanReadableDate } from '~/utils/helpers/shared';
import { authenticatedProcedure, createTRPCRouter } from '../trpc';

export const fileRouter = createTRPCRouter({
  getReceivedFiles: authenticatedProcedure
    .input(
      z.object({
        currentPage: z.number(),
        filesPerPage: z.number(),
        deleted: z.boolean(),
      }),
    )
    .query(async ({ ctx: { prisma, session }, input: { filesPerPage, currentPage, deleted } }) => {
      const { publicKey: receiverPublicKey, privateKey: receiverPrivateKey } = getUserKeysWithGuard(session);

      const totalFiles = await prisma.appFile.count({
        where: {
          deletedAt: deleted
            ? {
                not: null,
              }
            : {
                equals: null,
              },
          receiver: {
            publicKey: receiverPublicKey,
          },
        },
      });

      const fileTablePageMetadata: FileTablePageMetadata = {
        totalFiles,
        totalPages: Math.ceil(totalFiles / filesPerPage),
      };

      const currentPageFiles = await prisma.appFile.findMany({
        where: {
          deletedAt: deleted
            ? {
                not: null,
              }
            : {
                equals: null,
              },
          receiver: {
            publicKey: receiverPublicKey,
          },
        },
        include: {
          sender: true,
        },
        skip: (currentPage - 1) * filesPerPage,
        take: filesPerPage,
        orderBy: {
          sharedAt: 'desc',
        },
      });

      const fileTablePageRows = currentPageFiles.map((sentFile) => {
        const {
          sender: { publicKey: senderPublicKey },
          s3Key,
          sharedAt,
          deletedAt,
          deletionReason,
          downloadedByReceiverAt,
        } = sentFile;

        const receiverEcdh = createECDH(eccCurveName);
        receiverEcdh.setPrivateKey(Buffer.from(receiverPrivateKey, 'hex'));

        const symmetricKey = receiverEcdh.computeSecret(Buffer.from(senderPublicKey, 'hex')).toString('hex');

        const { decryptedBuffer: decryptedFileNameBuffer, iv } = decrypt(s3Key, symmetricKey);

        let fileTablePageRow: FileTablePageRow = {
          otherParticipantPublicKey: senderPublicKey,
          fileName: decryptedFileNameBuffer.toString('utf-8'),
          sharedAt: getHumanReadableDate(sharedAt),
          iv: iv.toString('hex'),
          isNew: !downloadedByReceiverAt,
        };
        if (deletedAt && deletionReason) {
          fileTablePageRow = { ...fileTablePageRow, deletedAt: getHumanReadableDate(deletedAt), deletionReason };
        }

        return fileTablePageRow;
      });

      const filesPage: FileTablePageData = {
        metadata: fileTablePageMetadata,
        rows: fileTablePageRows,
      };

      return filesPage;
    }),
  getSentFiles: authenticatedProcedure
    .input(
      z.object({
        currentPage: z.number(),
        filesPerPage: z.number(),
        deleted: z.boolean(),
      }),
    )
    .query(async ({ ctx: { prisma, session }, input: { filesPerPage, currentPage, deleted } }) => {
      const { publicKey: senderPublicKey, privateKey: senderPrivateKey } = getUserKeysWithGuard(session);

      const totalFiles = await prisma.appFile.count({
        where: {
          deletedAt: deleted
            ? {
                not: null,
              }
            : {
                equals: null,
              },
          sender: {
            publicKey: senderPublicKey,
          },
        },
      });

      const fileTablePageMetadata: FileTablePageMetadata = {
        totalFiles,
        totalPages: Math.ceil(totalFiles / filesPerPage),
      };

      const currentPageFiles = await prisma.appFile.findMany({
        where: {
          deletedAt: deleted
            ? {
                not: null,
              }
            : {
                equals: null,
              },
          sender: {
            publicKey: senderPublicKey,
          },
        },
        include: {
          receiver: true,
        },
        skip: (currentPage - 1) * filesPerPage,
        take: filesPerPage,
        orderBy: {
          sharedAt: 'desc',
        },
      });

      const fileTablePageRows = currentPageFiles.map((sentFile) => {
        const {
          receiver: { publicKey: receiverPublicKey },
          s3Key,
          sharedAt,
          deletedAt,
          deletionReason,
        } = sentFile;

        const senderEcdh = createECDH(eccCurveName);
        senderEcdh.setPrivateKey(Buffer.from(senderPrivateKey, 'hex'));

        const symmetricKey = senderEcdh.computeSecret(Buffer.from(receiverPublicKey, 'hex')).toString('hex');

        const { decryptedBuffer: decryptedFileNameBuffer, iv } = decrypt(s3Key, symmetricKey);

        let fileTablePageRow: FileTablePageRow = {
          otherParticipantPublicKey: receiverPublicKey,
          fileName: decryptedFileNameBuffer.toString('utf-8'),
          sharedAt: getHumanReadableDate(sharedAt),
          iv: iv.toString('hex'),
        };
        if (deletedAt && deletionReason) {
          fileTablePageRow = { ...fileTablePageRow, deletedAt: getHumanReadableDate(deletedAt), deletionReason };
        }

        return fileTablePageRow;
      });

      const filesPage: FileTablePageData = {
        metadata: fileTablePageMetadata,
        rows: fileTablePageRows,
      };

      return filesPage;
    }),
  shareFile: authenticatedProcedure
    .input(
      z.object({
        receiverIdentifier: z
          .string()
          .length(eccCurvePublicKeyLength, 'Acest identificator este invalid.')
          .startsWith('04', 'Acest identificator este invalid.')
          .or(z.string().email('Acest identificator este invalid.')),
        fileName: z.string(),
        fileType: z.string(),
      }),
    )
    .mutation(async ({ ctx: { prisma, session }, input: { receiverIdentifier, fileName, fileType } }) => {
      const { privateKey: senderPrivateKey, publicKey: senderPublicKey } = getUserKeysWithGuard(session);

      const receiver = await prisma.appUser.findFirst({
        where: {
          OR: [
            {
              publicKey: receiverIdentifier,
            },
            {
              email: receiverIdentifier,
            },
          ],
        },
        select: {
          id: true,
          publicKey: true,
        },
      });
      if (!receiver) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Acest identificator nu este atribuit unui cont.',
        });
      }

      if (receiver.publicKey === senderPublicKey) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Nu îți poți trimite un fișier ție însuți.',
        });
      }

      const senderEcdh = createECDH(eccCurveName);
      senderEcdh.setPrivateKey(Buffer.from(senderPrivateKey, 'hex'));

      const symmetricKey = senderEcdh.computeSecret(Buffer.from(receiver.publicKey, 'hex')).toString('hex');
      const s3Key = encrypt(fileName, symmetricKey).encryptedBuffer.toString('hex');

      const s3 = new S3({});
      const presignedPost = await createPresignedPost(s3, {
        Bucket: env.AWS_S3_BUCKET_NAME_FILES,
        Key: s3Key,
        Fields: {
          'Content-Type': fileType,
        },
        Expires: defaultAwsExpirationSeconds,
        Conditions: [['content-length-range', 0, maxFileSizeInBytes]],
      });

      const presignedPostKey = presignedPost.fields.key;
      if (!presignedPostKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'A intervenit o eroare. Te rugăm să reîncerci.',
        });
      }

      const sender = await prisma.appUser.findFirst({
        where: {
          publicKey: senderPublicKey,
        },
        select: {
          id: true,
        },
      });
      if (!sender) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'A intervenit o eroare. Te rugăm să te reautentifici.',
        });
      }

      await prisma.appFile.create({
        data: {
          senderId: sender.id,
          receiverId: receiver.id,
          s3Key: presignedPostKey,
        },
      });

      return {
        receiverPublicKey: receiver.publicKey,
        presignedPost,
      };
    }),
  initiateFileDownload: authenticatedProcedure
    .input(
      z.object({
        otherParticipantPublicKey: z.string(),
        fileName: z.string(),
        iv: z.string(),
      }),
    )
    .query(async ({ ctx: { prisma, session }, input: { otherParticipantPublicKey, fileName, iv } }) => {
      const { privateKey } = getUserKeysWithGuard(session);

      const ecdh = createECDH(eccCurveName);
      ecdh.setPrivateKey(Buffer.from(privateKey, 'hex'));

      const symmetricKey = ecdh.computeSecret(Buffer.from(otherParticipantPublicKey, 'hex')).toString('hex');
      const s3Key = encrypt(fileName, symmetricKey, Buffer.from(iv, 'hex')).encryptedBuffer.toString('hex');

      const s3 = new S3({});
      const getCommand = new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME_FILES,
        Key: s3Key,
      });
      const signedGetUrl = await getSignedUrl(s3, getCommand, {
        expiresIn: defaultAwsExpirationSeconds,
      });

      const fileReceived = await prisma.appFile.findFirst({
        where: {
          s3Key,
          receiver: {
            publicKey: {
              not: otherParticipantPublicKey,
            },
          },
        },
        select: {
          id: true,
        },
      });
      if (fileReceived) {
        await prisma.appFile.update({
          where: {
            id: fileReceived.id,
          },
          data: {
            downloadedByReceiverAt: new Date(),
          },
        });
      }

      return {
        signedGetUrl,
      };
    }),
  deleteFile: authenticatedProcedure
    .input(
      z.object({
        otherParticipantPublicKey: z.string(),
        fileName: z.string(),
        iv: z.string(),
      }),
    )
    .mutation(async ({ ctx: { prisma, session }, input: { otherParticipantPublicKey, fileName, iv } }) => {
      const { privateKey } = getUserKeysWithGuard(session);

      const ecdh = createECDH(eccCurveName);
      ecdh.setPrivateKey(Buffer.from(privateKey, 'hex'));

      const symmetricKey = ecdh.computeSecret(Buffer.from(otherParticipantPublicKey, 'hex')).toString('hex');
      const s3Key = encrypt(fileName, symmetricKey, Buffer.from(iv, 'hex')).encryptedBuffer.toString('hex');

      const s3 = new S3({});
      const deleteCommand = new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME_FILES,
        Key: s3Key,
      });

      await s3.send(deleteCommand);

      const otherReceiver = await prisma.appFile.findFirst({
        where: {
          s3Key,
          receiver: {
            publicKey: otherParticipantPublicKey,
          },
        },
        select: {
          id: true,
        },
      });

      await prisma.appFile.update({
        where: {
          s3Key,
        },
        data: {
          deletedAt: new Date(),
          deletionReason: otherReceiver ? DeletionReason.DeletedBySender : DeletionReason.DeletedByReceiver,
        },
      });
    }),
  getNumberOfNewReceivedFiles: authenticatedProcedure.query(async ({ ctx: { prisma, session } }) => {
    const { publicKey } = getUserKeysWithGuard(session);

    const numberOfNewReceivedFiles = await prisma.appFile.count({
      where: {
        receiver: {
          publicKey,
        },
        downloadedByReceiverAt: {
          equals: null,
        },
        deletedAt: {
          equals: null,
        },
      },
    });

    return numberOfNewReceivedFiles;
  }),
});
