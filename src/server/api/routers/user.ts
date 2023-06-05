import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getUserKeysWithGuard } from '~/utils/helpers/auth';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const userRouter = createTRPCRouter({
  fetchUserWithGuard: publicProcedure
    .input(
      z.object({
        publicKey: z.string().length(130, 'Cheie publică invalidă.'),
      }),
    )
    .query(async ({ ctx, input: { publicKey } }) => {
      const user = await ctx.prisma.appUser.findUniqueOrThrow({
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
    .mutation(async ({ ctx, input: { email } }) => {
      const match = await ctx.prisma.appUser.findUnique({
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

      const { publicKey } = getUserKeysWithGuard(ctx.session);
      await ctx.prisma.appUser.update({
        where: {
          publicKey,
        },
        data: {
          email,
        },
      });
    }),
  updateUserName: publicProcedure
    .input(
      z.object({
        name: z.string().min(3, 'Acest nume nu este valid.'),
      }),
    )
    .mutation(async ({ ctx, input: { name } }) => {
      const { publicKey } = getUserKeysWithGuard(ctx.session);

      await ctx.prisma.appUser.update({
        where: {
          publicKey,
        },
        data: {
          name,
        },
      });
    }),
});
