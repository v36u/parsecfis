import { createTRPCRouter, publicProcedure } from '../trpc';

export const userRouter = createTRPCRouter({
  fetchUserWithGuard: publicProcedure.query(async ({ ctx }) => {
    const publicKey = ctx.session?.user.publicKey;
    if (!publicKey) {
      throw new Error('Cheia publica nu există în sesiune.');
    }

    const user = await ctx.prisma.user.findUniqueOrThrow({
      where: {
        publicKey,
      },
    });

    return user;
  }),
});
