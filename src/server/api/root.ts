import { createTRPCRouter } from '~/server/api/trpc';
import { authRouter } from './routers/auth';
import { fileRouter } from './routers/file';
import { userRouter } from './routers/user';

export const appRouter = createTRPCRouter({
  user: userRouter,
  auth: authRouter,
  file: fileRouter,
});

export type AppRouter = typeof appRouter;
