import { createECDH } from 'crypto';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const authRouter = createTRPCRouter({
  createPrivateKey: publicProcedure.query(() => {
    const ecdh = createECDH('secp256k1');
    ecdh.generateKeys();

    const privateKey = ecdh.getPrivateKey().toString('hex');

    return privateKey;
  }),
});
