import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, S3 } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { env } from '~/env.mjs';
import { defaultAwsExpirationSeconds, eccCurvePublicKeyLength, maxProfileImageSizeInBytes } from '~/utils/constants';
import { getUserKeysWithGuard } from '~/utils/helpers/auth';
import { getProfileImageS3Key } from '~/utils/helpers/user';
import { authenticatedProcedure, createTRPCRouter, publicProcedure } from '../trpc';

export const userRouter = createTRPCRouter({
  fetchUserWithGuard: publicProcedure
    .input(
      z.object({
        publicKey: z.string().length(eccCurvePublicKeyLength, 'Cheie publică invalidă.'),
      }),
    )
    .query(async ({ ctx: { prisma }, input: { publicKey } }) => {
      const user = await prisma.appUser.findUniqueOrThrow({
        where: {
          publicKey,
        },
      });
      return user;
    }),
  fetchUser: publicProcedure
    .input(
      z.object({
        publicKey: z.string().length(eccCurvePublicKeyLength, 'Cheie publică invalidă.'),
      }),
    )
    .query(async ({ ctx: { prisma }, input: { publicKey } }) => {
      const user = await prisma.appUser.findFirst({
        where: {
          publicKey,
        },
      });
      return user;
    }),
  updateEmail: authenticatedProcedure
    .input(
      z.object({
        email: z.string().email('Această adresă de email nu este validă.'),
      }),
    )
    .mutation(async ({ ctx: { prisma, session }, input: { email } }) => {
      const match = await prisma.appUser.findUnique({
        where: {
          email,
        },
      });
      if (match) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Această adresă de email este deja utilizată.',
        });
      }

      const { publicKey } = getUserKeysWithGuard(session);
      await prisma.appUser.update({
        where: {
          publicKey,
        },
        data: {
          email,
        },
      });
    }),
  updateName: authenticatedProcedure
    .input(
      z.object({
        name: z.string().min(3, 'Acest nume nu este valid.'),
      }),
    )
    .mutation(async ({ ctx: { prisma, session }, input: { name } }) => {
      const { publicKey } = getUserKeysWithGuard(session);

      await prisma.appUser.update({
        where: {
          publicKey,
        },
        data: {
          name,
        },
      });
    }),
  uploadProfileImage: authenticatedProcedure
    .input(
      z.object({
        fileType: z.string(),
      }),
    )
    .mutation(async ({ ctx: { session }, input: { fileType } }) => {
      const { publicKey } = getUserKeysWithGuard(session);

      const s3Key = getProfileImageS3Key(publicKey);

      const s3 = new S3({});
      const presignedPost = await createPresignedPost(s3, {
        Bucket: env.AWS_S3_BUCKET_NAME_PROFILE_IMAGES,
        Key: s3Key,
        Fields: {
          'Content-Type': fileType,
        },
        Expires: defaultAwsExpirationSeconds,
        Conditions: [['content-length-range', 0, maxProfileImageSizeInBytes]],
      });

      return {
        presignedPost,
      };
    }),
  deleteProfileImage: authenticatedProcedure.mutation(async ({ ctx: { session } }) => {
    const { publicKey } = getUserKeysWithGuard(session);

    const s3Key = getProfileImageS3Key(publicKey);

    const s3 = new S3({});
    const deleteCommand = new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME_PROFILE_IMAGES,
      Key: s3Key,
    });
    await s3.send(deleteCommand);
  }),
  initiateProfileImageDownload: authenticatedProcedure
    .input(
      z.object({
        publicKey: z.string().length(eccCurvePublicKeyLength, 'Cheie publică invalidă.'),
      }),
    )
    .query(async ({ input: { publicKey } }) => {
      const s3Key = getProfileImageS3Key(publicKey);

      const s3 = new S3({});

      try {
        const headCommand = new HeadObjectCommand({
          Bucket: env.AWS_S3_BUCKET_NAME_PROFILE_IMAGES,
          Key: s3Key,
        });
        const headCommandResponse = await s3.send(headCommand);

        if (headCommandResponse.ContentLength === 0) {
          return {
            signedGetUrl: null,
          };
        }
      } catch (_) {
        return {
          signedGetUrl: null,
        };
      }

      const getCommand = new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME_PROFILE_IMAGES,
        Key: s3Key,
      });
      const signedGetUrl = await getSignedUrl(s3, getCommand, {
        expiresIn: defaultAwsExpirationSeconds,
      });

      return {
        signedGetUrl,
      };
    }),
});
