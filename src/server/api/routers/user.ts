import { type Session } from 'next-auth';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

const getPublicKeyWithGuard = (session: Session | null) => {
  const publicKey = session?.user.publicKey;
  if (!publicKey) {
    throw new Error('Cheia publica nu există în sesiune.');
  }
  return publicKey;
};

export const userRouter = createTRPCRouter({
  fetchUserWithGuard: publicProcedure.query(async ({ ctx }) => {
    const publicKey = getPublicKeyWithGuard(ctx.session);

    const user = await ctx.prisma.user.findUniqueOrThrow({
      where: {
        publicKey,
      },
    });
    return user;
  }),
  updateUserField: publicProcedure
    .input(
      z.object({
        fieldName: z.string(),
        fieldValue: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const publicKey = getPublicKeyWithGuard(ctx.session);

      await ctx.prisma.user.update({
        where: {
          publicKey,
        },
        data: {
          [input.fieldName]: input.fieldValue,
        },
      });
    }),
});
