import { generateKeyPairSync } from 'crypto';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const authRouter = createTRPCRouter({
  createPrivateKey: publicProcedure.query(() => {
    const { privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'secp160r1',
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
    });

    return privateKey;
  }),
});
