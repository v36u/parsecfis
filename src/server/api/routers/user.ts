import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getUserKeysWithGuard } from '~/utils/helpers/auth';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const userRouter = createTRPCRouter({
  fetchUserWithGuard: publicProcedure.query(async ({ ctx }) => {
    const { publicKey } = getUserKeysWithGuard(ctx.session);

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

      const { publicKey } = getUserKeysWithGuard(ctx.session);
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
      const { publicKey } = getUserKeysWithGuard(ctx.session);
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
