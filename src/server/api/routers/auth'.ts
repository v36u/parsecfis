import { generateKeyPairSync } from "crypto";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  createPrivateKey: publicProcedure.input(z.object({})).query(() => {
    const { privateKey } = generateKeyPairSync("ec", {
      namedCurve: "prime256v1",
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    return privateKey;
  }),
});
