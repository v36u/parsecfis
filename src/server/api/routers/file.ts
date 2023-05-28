import { z } from 'zod';
import { getUserKeysWithGuard } from '~/utils/helper/auth';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const fileRouter = createTRPCRouter({
  createFile: publicProcedure
    .input(
      z.object({
        receiverIdentifier: z.string().length(192, 'Acest identificator este invalid.').or(z.string().email('Acest identificator este invalid.')),
        fileName: z.string(),
        fileType: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
        return;
      }

      const { privateKey: senderPrivateKey } = getUserKeysWithGuard(ctx.session);

      // await ctx.prisma.file.create({
      //   data: {
      //     senderKey,
      //   },
      // });
    }),
});
