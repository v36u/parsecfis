import { S3 } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { TRPCError } from '@trpc/server';
import { createECDH } from 'crypto';
import { z } from 'zod';
import { env } from '~/env.mjs';
import { maxFileSizeInBytes } from '~/utils/constants';
import { getUserKeysWithGuard } from '~/utils/helpers/auth';
import { encrypt } from '~/utils/helpers/encryption';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const fileRouter = createTRPCRouter({
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
      const sender = await ctx.prisma.user.findFirst({
        where: {
          publicKey: senderPublicKey,
        },
      });
      if (!sender) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'A intervenit o eroare. Te rugăm să te reautentifici.',
        });
      }
      const receiver = await ctx.prisma.user.findFirst({
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

      const senderEcdh = createECDH('secp256k1');
      senderEcdh.setPrivateKey(Buffer.from(senderPrivateKey, 'hex'));

      const symmetricKey = senderEcdh.computeSecret(Buffer.from(receiver.publicKey, 'hex')).toString('hex');

      const s3 = new S3({});
      const presignedPost = await createPresignedPost(s3, {
        Key: encrypt(input.fileName, symmetricKey).toString('hex'),
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

      const file = await ctx.prisma.file.create({
        data: {
          senderId: sender.id,
          s3Key: presignedPostKey,
        },
      });

      await ctx.prisma.fileShare.create({
        data: {
          fileId: file.id,
          receiverId: receiver.id,
        },
      });

      return {
        symmetricKey,
        presignedPost,
      };
    }),
});
