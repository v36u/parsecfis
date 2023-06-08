import { createECDH } from 'crypto';
import { eccCurveName } from '~/utils/constants';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const authRouter = createTRPCRouter({
  createPrivateKey: publicProcedure.query(() => {
    const ecdh = createECDH(eccCurveName);
    ecdh.generateKeys();

    const privateKey = ecdh.getPrivateKey().toString('hex');

    return privateKey;
  }),
});
