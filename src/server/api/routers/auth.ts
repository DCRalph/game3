import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  me: publicProcedure.query(async ({ ctx }) => {
    const session = ctx.session;
    return { session };
  }),

  signUp: publicProcedure.input(z.object({ name: z.string().min(1).max(30) })).mutation(async ({ ctx, input }) => {

    // check if the session is already authenticated
    if (ctx.session.userId) {
      throw new Error("You are already authenticated");
    }

    // Create user and associate with current session
    const user = await ctx.db.user.create({
      data: {
        name: input.name,
      },
    });

    // Associate user with current session
    await ctx.db.session.update({
      where: { id: ctx.session.id },
      data: {
        userId: user.id,
      },
    });

    return user;
  }),

  signOut: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session.userId) {
      throw new Error("You are not authenticated");
    }

    // Remove user association from session
    await ctx.db.session.update({
      where: { id: ctx.session.id },
      data: {
        userId: null,
      },
    });

    return { success: true };
  }),
});