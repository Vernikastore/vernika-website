import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createInquiry, createLead, listLeads, subscribeNewsletter, updateLeadStatus } from "./db";

const leadFields = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(320),
  phone: z.string().trim().min(7).max(40),
  company: z.string().trim().min(2).max(160),
  interestArea: z.string().trim().min(2).max(120),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  leads: router({
    create: publicProcedure.input(leadFields).mutation(({ input }) => createLead({ ...input, source: "website", status: "new" })),
    list: adminProcedure.query(() => listLeads()),
    updateStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "contacted", "qualified", "closed"]) })).mutation(({ input }) => updateLeadStatus(input.id, input.status)),
  }),
  inquiries: router({
    create: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(120), email: z.string().email().max(320), company: z.string().trim().max(160).optional(), message: z.string().trim().min(10).max(3000) })).mutation(({ input }) => createInquiry(input)),
  }),
  newsletter: router({
    subscribe: publicProcedure.input(z.object({ email: z.string().email().max(320) })).mutation(({ input }) => subscribeNewsletter(input.email)),
  }),
});

export type AppRouter = typeof appRouter;
