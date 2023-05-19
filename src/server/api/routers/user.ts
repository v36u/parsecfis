import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getByPublicKey: publicProcedure
    .input(z.object({ publicKey: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.user.findUnique({
        where: {
          publicKey: input.publicKey,
        },
      });
    }),
  postNewUser: publicProcedure
    .input(z.object({ publicKey: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.user.create({
        data: {
          publicKey: input.publicKey,
        },
      });
    }),
});
