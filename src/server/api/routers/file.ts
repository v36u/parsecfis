import { S3 } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { TRPCError } from '@trpc/server';
import { createECDH } from 'crypto';
import { z } from 'zod';
import { env } from '~/env.mjs';
import { type FileTablePageData, type FileTablePageMetadata, type FileTablePageRow } from '~/utils/@types/FileTablePageData';
import { maxFileSizeInBytes } from '~/utils/constants';
import { getUserKeysWithGuard } from '~/utils/helpers/auth';
import { decrypt, encrypt } from '~/utils/helpers/encryption';
import { getHumanReadableDate } from '~/utils/helpers/shared';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const fileRouter = createTRPCRouter({
  getSentFiles: publicProcedure
    .input(
      z.object({
        currentPage: z.number(),
        filesPerPage: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { publicKey: senderPublicKey, privateKey: senderPrivateKey } = getUserKeysWithGuard(ctx.session);

      const totalFiles = await ctx.prisma.appFile.count({
        where: {
          sender: {
            publicKey: senderPublicKey,
          },
        },
      });

      const fileTablePageMetadata: FileTablePageMetadata = {
        totalFiles,
        totalPages: Math.ceil(totalFiles / input.filesPerPage),
      };

      const currentPageFiles = await ctx.prisma.appFile.findMany({
        where: {
          sender: {
            publicKey: senderPublicKey,
          },
        },
        include: {
          receiver: true,
        },
      });

      const fileTablePageRows = currentPageFiles.map((sentFile) => {
        const {
          receiver: { publicKey: receiverPublicKey },
          sharedAt,
          s3Key,
        } = sentFile;

        const senderEcdh = createECDH('secp256k1');
        senderEcdh.setPrivateKey(Buffer.from(senderPrivateKey, 'hex'));

        const symmetricKey = senderEcdh.computeSecret(Buffer.from(receiverPublicKey, 'hex')).toString('hex');

        const { decryptedBuffer: decryptedFileNameBuffer, iv } = decrypt(s3Key, symmetricKey);

        const fileTablePageRow: FileTablePageRow = {
          publicKey: receiverPublicKey,
          sharedAt: getHumanReadableDate(sharedAt),
          fileName: decryptedFileNameBuffer.toString('utf-8'),
          iv: iv.toString('hex'),
        };

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
    .mutation(async ({ ctx, input }) => {
      const { privateKey: senderPrivateKey, publicKey: senderPublicKey } = getUserKeysWithGuard(ctx.session);

      const receiver = await ctx.prisma.appUser.findFirst({
        where: {
          OR: [
            {
              publicKey: input.receiverIdentifier,
            },
            {
              email: input.receiverIdentifier,
            },
          ],
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

      const senderEcdh = createECDH('secp256k1');
      senderEcdh.setPrivateKey(Buffer.from(senderPrivateKey, 'hex'));

      const symmetricKey = senderEcdh.computeSecret(Buffer.from(receiver.publicKey, 'hex')).toString('hex');

      const s3 = new S3({});
      const presignedPost = await createPresignedPost(s3, {
        Key: encrypt(input.fileName, symmetricKey).encryptedBuffer.toString('hex'),
        Bucket: env.AWS_S3_BUCKET_NAME,
        Fields: {
          'Content-Type': input.fileType,
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

      const withSenderId = await ctx.prisma.appUser.findFirst({
        where: {
          publicKey: senderPublicKey,
        },
        select: {
          id: true,
        },
      });
      if (!withSenderId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'A intervenit o eroare. Te rugăm să te reautentifici.',
        });
      }

      await ctx.prisma.appFile.create({
        data: {
          senderId: withSenderId.id,
          receiverId: receiver.id,
          s3Key: presignedPostKey,
        },
      });

      return {
        symmetricKey,
        presignedPost,
      };
    }),
});
