import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    AWS_ACCESS_KEY_ID: z.string().length(20),
    AWS_REGION: z.string(),
    AWS_S3_BUCKET_NAME_FILES: z.string(),
    AWS_S3_BUCKET_NAME_PROFILE_IMAGES: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string().length(40),
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: process.env.NODE_ENV === 'production' ? z.string().min(1) : z.string().min(1).optional(),
    NEXTAUTH_JWT_SECRET: process.env.NODE_ENV === 'production' ? z.string().min(1) : z.string().min(1).optional(),
    NEXTAUTH_URL: z.preprocess((str) => process.env.VERCEL_URL ?? str, process.env.VERCEL ? z.string().min(1) : z.string().url()),
    NODE_ENV: z.enum(['development', 'test', 'production']),
  },

  client: {},

  runtimeEnv: {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET_NAME_FILES: process.env.AWS_S3_BUCKET_NAME_FILES,
    AWS_S3_BUCKET_NAME_PROFILE_IMAGES: process.env.AWS_S3_BUCKET_NAME_PROFILE_IMAGES,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_JWT_SECRET: process.env.NEXTAUTH_JWT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
});
