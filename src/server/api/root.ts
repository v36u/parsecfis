import { createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "./routers/user";
import { utilsRouter } from "./routers/utils";

export const appRouter = createTRPCRouter({
  user: userRouter,
  utils: utilsRouter,
});

export type AppRouter = typeof appRouter;
