import { DeleteObjectCommand, GetObjectCommand, S3 } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { env } from '~/env.mjs';
import { defaultAwsExpirationSeconds, maxProfileImageSizeInBytes } from '~/utils/constants';
import { getUserKeys, getUserKeysWithGuard } from '~/utils/helpers/auth';
import { encrypt } from '~/utils/helpers/encryption';
import { authenticatedProcedure, createTRPCRouter, publicProcedure } from '../trpc';

export const userRouter = createTRPCRouter({
  fetchUser: publicProcedure
    .input(
      z.object({
        publicKey: z.string(),
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
        isPrivate: z.boolean(),
      }),
    )
    .mutation(async ({ ctx: { session, prisma }, input: { fileType, isPrivate } }) => {
      const { publicKey, privateKey } = getUserKeysWithGuard(session);

      let s3Key = publicKey;
      if (isPrivate) {
        s3Key = encrypt(s3Key, privateKey).encryptedBuffer.toString('hex');
      }

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

      await prisma.appUser.update({
        data: {
          profilePictureS3Key: s3Key,
        },
        where: {
          publicKey,
        },
      });

      return {
        presignedPost,
      };
    }),
  deleteProfileImage: authenticatedProcedure.mutation(async ({ ctx: { session, prisma } }) => {
    const { publicKey } = getUserKeysWithGuard(session);

    const foundUser = await prisma.appUser.findFirst({
      where: {
        publicKey,
      },
      select: {
        profilePictureS3Key: true,
      },
    });
    if (!foundUser?.profilePictureS3Key) {
      return;
    }

    const s3 = new S3({});
    const deleteCommand = new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME_PROFILE_IMAGES,
      Key: foundUser.profilePictureS3Key,
    });
    await s3.send(deleteCommand);

    await prisma.appUser.update({
      data: {
        profilePictureS3Key: null,
      },
      where: {
        publicKey,
      },
    });
  }),
  initiateProfileImageDownload: publicProcedure
    .input(
      z.object({
        publicKey: z.string(),
      }),
    )
    .query(async ({ ctx: { session, prisma }, input: { publicKey } }) => {
      const foundUser = await prisma.appUser.findFirst({
        where: {
          publicKey,
        },
        select: {
          profilePictureS3Key: true,
        },
      });

      if (!foundUser?.profilePictureS3Key) {
        return {
          signedGetUrl: null,
        };
      }

      const { profilePictureS3Key } = foundUser;

      const { publicKey: sessionPublicKey } = getUserKeys(session);
      const isPrivateS3Key = publicKey !== profilePictureS3Key;
      if (isPrivateS3Key && sessionPublicKey !== publicKey) {
        return {
          signedGetUrl: null,
        };
      }

      const s3 = new S3({});

      const getCommand = new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME_PROFILE_IMAGES,
        Key: profilePictureS3Key,
      });
      const signedGetUrl = await getSignedUrl(s3, getCommand, {
        expiresIn: defaultAwsExpirationSeconds,
      });

      return {
        signedGetUrl,
        isPrivate: isPrivateS3Key,
      };
    }),
});
