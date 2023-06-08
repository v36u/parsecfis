import { DeleteObjectCommand, GetObjectCommand, S3 } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { TRPCError } from '@trpc/server';
import { createECDH } from 'crypto';
import { z } from 'zod';
import { env } from '~/env.mjs';
import { type FileTablePageData, type FileTablePageMetadata, type FileTablePageRow } from '~/utils/@types/FileTablePageData';
import { eccCurveName, maxFileSizeInBytes } from '~/utils/constants';
import { getUserKeysWithGuard } from '~/utils/helpers/auth';
import { decrypt, encrypt } from '~/utils/helpers/encryption';
import { getHumanReadableDate } from '~/utils/helpers/shared';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const fileRouter = createTRPCRouter({
  getReceivedFiles: publicProcedure
    .input(
      z.object({
        currentPage: z.number(),
        filesPerPage: z.number(),
        deleted: z.boolean(),
      }),
    )
    .query(async ({ ctx, input: { filesPerPage, currentPage, deleted } }) => {
      const { publicKey: receiverPublicKey, privateKey: receiverPrivateKey } = getUserKeysWithGuard(ctx.session);

      const totalFiles = await ctx.prisma.appFile.count({
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

      const currentPageFiles = await ctx.prisma.appFile.findMany({
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
        } = sentFile;

        const receiverEcdh = createECDH(eccCurveName);
        receiverEcdh.setPrivateKey(Buffer.from(receiverPrivateKey, 'hex'));

        const symmetricKey = receiverEcdh.computeSecret(Buffer.from(senderPublicKey, 'hex')).toString('hex');

        const { decryptedBuffer: decryptedFileNameBuffer, iv } = decrypt(s3Key, symmetricKey);

        const fileTablePageRow: FileTablePageRow = {
          otherParticipantPublicKey: senderPublicKey,
          fileName: decryptedFileNameBuffer.toString('utf-8'),
          sharedAt: getHumanReadableDate(sharedAt),
          iv: iv.toString('hex'),
        };
        if (deletedAt) {
          fileTablePageRow.deletedAt = getHumanReadableDate(deletedAt);
        }

        return fileTablePageRow;
      });

      const filesPage: FileTablePageData = {
        metadata: fileTablePageMetadata,
        rows: fileTablePageRows,
      };

      return filesPage;
    }),
  getSentFiles: publicProcedure
    .input(
      z.object({
        currentPage: z.number(),
        filesPerPage: z.number(),
        deleted: z.boolean(),
      }),
    )
    .query(async ({ ctx, input: { filesPerPage, currentPage, deleted } }) => {
      const { publicKey: senderPublicKey, privateKey: senderPrivateKey } = getUserKeysWithGuard(ctx.session);

      const totalFiles = await ctx.prisma.appFile.count({
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

      const currentPageFiles = await ctx.prisma.appFile.findMany({
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
        } = sentFile;

        const senderEcdh = createECDH(eccCurveName);
        senderEcdh.setPrivateKey(Buffer.from(senderPrivateKey, 'hex'));

        const symmetricKey = senderEcdh.computeSecret(Buffer.from(receiverPublicKey, 'hex')).toString('hex');

        const { decryptedBuffer: decryptedFileNameBuffer, iv } = decrypt(s3Key, symmetricKey);

        const fileTablePageRow: FileTablePageRow = {
          otherParticipantPublicKey: receiverPublicKey,
          fileName: decryptedFileNameBuffer.toString('utf-8'),
          sharedAt: getHumanReadableDate(sharedAt),
          iv: iv.toString('hex'),
        };

        if (deletedAt) {
          fileTablePageRow.deletedAt = getHumanReadableDate(deletedAt);
        }

        return fileTablePageRow;
      });

      const filesPage: FileTablePageData = {
        metadata: fileTablePageMetadata,
        rows: fileTablePageRows,
      };

      return filesPage;
    }),
  shareFile: publicProcedure
    .input(
      z.object({
        receiverIdentifier: z
          .string()
          .length(130, 'Acest identificator este invalid.')
          .startsWith('04', 'Acest identificator este invalid.')
          .or(z.string().email('Acest identificator este invalid.')),
        fileName: z.string(),
        fileType: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: { receiverIdentifier, fileName, fileType } }) => {
      const { privateKey: senderPrivateKey, publicKey: senderPublicKey } = getUserKeysWithGuard(ctx.session);

      const receiver = await ctx.prisma.appUser.findFirst({
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
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Fields: {
          'Content-Type': fileType,
        },
        Expires: 5, // secunde
        Conditions: [['content-length-range', 0, maxFileSizeInBytes]],
      });

      const presignedPostKey = presignedPost.fields.key;
      if (!presignedPostKey) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'A intervenit o eroare. Te rugăm să reîncerci.',
        });
      }

      const sender = await ctx.prisma.appUser.findFirst({
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

      await ctx.prisma.appFile.create({
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
  initiateFileDownload: publicProcedure
    .input(
      z.object({
        otherParticipantPublicKey: z.string(),
        fileName: z.string(),
        iv: z.string(),
      }),
    )
    .query(async ({ ctx, input: { otherParticipantPublicKey, fileName, iv } }) => {
      const { privateKey } = getUserKeysWithGuard(ctx.session);

      const ecdh = createECDH(eccCurveName);
      ecdh.setPrivateKey(Buffer.from(privateKey, 'hex'));

      const symmetricKey = ecdh.computeSecret(Buffer.from(otherParticipantPublicKey, 'hex')).toString('hex');
      const s3Key = encrypt(fileName, symmetricKey, Buffer.from(iv, 'hex')).encryptedBuffer.toString('hex');

      const s3 = new S3({});
      const getCommand = new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
      });
      const signedGetUrl = await getSignedUrl(s3, getCommand, {
        expiresIn: 5, // secunde
      });

      return {
        signedGetUrl,
      };
    }),
  deleteFile: publicProcedure
    .input(
      z.object({
        otherParticipantPublicKey: z.string(),
        fileName: z.string(),
        iv: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: { otherParticipantPublicKey, fileName, iv } }) => {
      const { privateKey } = getUserKeysWithGuard(ctx.session);

      const ecdh = createECDH(eccCurveName);
      ecdh.setPrivateKey(Buffer.from(privateKey, 'hex'));

      const symmetricKey = ecdh.computeSecret(Buffer.from(otherParticipantPublicKey, 'hex')).toString('hex');
      const s3Key = encrypt(fileName, symmetricKey, Buffer.from(iv, 'hex')).encryptedBuffer.toString('hex');

      const s3 = new S3({});
      const deleteCommand = new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
      });

      await s3.send(deleteCommand);

      await ctx.prisma.appFile.update({
        where: {
          s3Key,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }),
});
