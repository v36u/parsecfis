import { TRPCError } from '@trpc/server';
import { createECDH, createPrivateKey } from 'crypto';
import { z } from 'zod';
import { getUserKeysWithGuard } from '~/utils/helper/auth';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const fileRouter = createTRPCRouter({
  sendFile: publicProcedure
    .input(
      z.object({
        // TODO: Make '04' standard prefix
        receiverIdentifier: z.string().length(130, 'Acest identificator este invalid.').or(z.string().email('Acest identificator este invalid.')),
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Acest identificator nu este atribuit unui cont.',
        });
      }

      const senderEcdh = createECDH('secp256k1');
      const { privateKeyPem: senderPrivateKeyPem } = getUserKeysWithGuard(ctx.session);
      senderEcdh.setPrivateKey(
        createPrivateKey(senderPrivateKeyPem).export({
          type: 'sec1',
          format: 'der',
        }),
      );

      // const receiverPublicKeyBuffer = createPublicKey({
      //   key: Buffer.from(receiver.publicKey, 'hex'),
      //   type: 'spki',
      //   format: 'pem',
      // }).export({
      //   type: 'spki',
      //   format: 'der',
      // });

      // const symmetricKey = senderEcdh.computeSecret(receiverPublicKeyBuffer).toString('hex');

      // return {
      //   symmetricKey,
      // };
    }),
});
