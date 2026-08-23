import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { createConsultationRequest, createInquiry, createLead, listConsultationRequests, listLeads, subscribeNewsletter, updateConsultationStatus, updateLeadStatus } from "./db";

const leadFields = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(320),
  phone: z.string().trim().min(7).max(40),
  company: z.string().trim().min(2).max(160),
  companySize: z.string().trim().min(1).max(80),
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
  consultations: router({
    create: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(120), email: z.string().email().max(320), company: z.string().trim().max(160).optional(), scheduledAt: z.coerce.date().refine(date => date.getTime() > Date.now(), "Choose a future time"), timezone: z.string().trim().min(1).max(80) })).mutation(({ input }) => createConsultationRequest({ ...input, status: "requested" })),
    list: adminProcedure.query(() => listConsultationRequests()),
    updateStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["requested", "confirmed", "completed", "cancelled"]) })).mutation(({ input }) => updateConsultationStatus(input.id, input.status)),
  }),
  chatbot: router({
    ask: publicProcedure.input(z.object({ message: z.string().trim().min(1).max(800), history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1200) })).max(8).default([]) })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are Vernika’s friendly website assistant. Answer basic client questions about Vernika’s digital transformation, automation, CRM, Salesforce tooling, business management application, services, demos, and next steps. Be concise, warm, practical, and never invent specific client results, pricing beyond the public tiers, or guarantees. If a question needs a human, recommend the Contact page. Keep responses under 90 words." },
          ...input.history,
          { role: "user", content: input.message },
        ],
      });
      const content = response.choices[0]?.message.content;
      return { answer: typeof content === "string" ? content : "I can help with Vernika’s services, application, and demo requests. Please try asking in a different way." };
    }),
  }),
});

export type AppRouter = typeof appRouter;
