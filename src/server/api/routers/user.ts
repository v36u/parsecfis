import { TRPCError } from '@trpc/server';
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
  updateUserEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email('Această adresă de email nu este validă.'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });
      if (match) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Această adresă de email este deja utilizată.',
        });
      }

      const publicKey = getPublicKeyWithGuard(ctx.session);
      await ctx.prisma.user.update({
        where: {
          publicKey,
        },
        data: {
          email: input.email,
        },
      });
    }),
  updateUserName: publicProcedure
    .input(
      z.object({
        name: z.string().min(3, 'Acest nume nu este valid.'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const publicKey = getPublicKeyWithGuard(ctx.session);
      await ctx.prisma.user.update({
        where: {
          publicKey,
        },
        data: {
          name: input.name,
        },
      });
    }),
});
