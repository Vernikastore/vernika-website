import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { createCaseStudy, createConsultationRequest, createInquiry, createLead, createProject, createSiteDetail, deleteCaseStudy, deleteProject, deleteSiteDetail, exportLeadAndConsultationCsv, listCaseStudies, listConsultationRequests, listLeads, listProjects, listSiteDetails, reorderCaseStudies, reorderProjects, subscribeNewsletter, updateCaseStudy, updateConsultationStatus, updateLeadStatus, updateProject, updateSiteDetail } from "./db";

const leadFields = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(320),
  phone: z.string().trim().min(7).max(40),
  company: z.string().trim().min(2).max(160),
  companySize: z.string().trim().min(1).max(80),
  interestArea: z.string().trim().min(2).max(120),
});

const caseStudyFields = z.object({
  slug: z.string().trim().min(2).max(160),
  clientName: z.string().trim().min(2).max(160),
  industry: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(220),
  metric: z.string().trim().min(1).max(80),
  metricLabel: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(4000),
  challenge: z.string().trim().min(10).max(4000),
  solution: z.string().trim().min(10).max(4000),
  outcome: z.string().trim().min(10).max(4000),
  isPublished: z.number().int().min(0).max(1).default(1),
});

const projectFields = z.object({
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(220),
  description: z.string().trim().min(10).max(4000),
  impact: z.string().trim().min(2).max(160),
  status: z.string().trim().min(1).max(80),
  isPublished: z.number().int().min(0).max(1).default(1),
});

const siteDetailFields = z.object({
  detailKey: z.string().trim().min(2).max(160),
  label: z.string().trim().min(2).max(160),
  value: z.string().trim().min(1).max(10000),
  isPublished: z.number().int().min(0).max(1).default(1),
});

const idInput = z.object({ id: z.number().int().positive() });
const reorderInput = z.array(z.object({ id: z.number().int().positive(), displayOrder: z.number().int().min(0).max(10000) })).min(1).max(100);
const updateCaseStudyInput = z.object({ id: z.number().int().positive(), data: caseStudyFields.partial() });
const updateProjectInput = z.object({ id: z.number().int().positive(), data: projectFields.partial() });
const updateSiteDetailInput = z.object({ id: z.number().int().positive(), data: siteDetailFields.partial() });

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
  content: router({
    caseStudies: publicProcedure.query(() => listCaseStudies(true)),
    projects: publicProcedure.query(() => listProjects(true)),
    siteDetails: publicProcedure.query(() => listSiteDetails(true)),
  }),
  admin: router({
    exportCsv: adminProcedure.mutation(() => exportLeadAndConsultationCsv()),
    caseStudies: router({
      list: adminProcedure.query(() => listCaseStudies()),
      create: adminProcedure.input(caseStudyFields).mutation(({ input }) => createCaseStudy(input)),
      update: adminProcedure.input(updateCaseStudyInput).mutation(({ input }) => updateCaseStudy(input.id, input.data)),
      delete: adminProcedure.input(idInput).mutation(({ input }) => deleteCaseStudy(input.id)),
      reorder: adminProcedure.input(reorderInput).mutation(({ input }) => reorderCaseStudies(input)),
    }),
    projects: router({
      list: adminProcedure.query(() => listProjects()),
      create: adminProcedure.input(projectFields).mutation(({ input }) => createProject(input)),
      update: adminProcedure.input(updateProjectInput).mutation(({ input }) => updateProject(input.id, input.data)),
      delete: adminProcedure.input(idInput).mutation(({ input }) => deleteProject(input.id)),
      reorder: adminProcedure.input(reorderInput).mutation(({ input }) => reorderProjects(input)),
    }),
    siteDetails: router({
      list: adminProcedure.query(() => listSiteDetails()),
      create: adminProcedure.input(siteDetailFields).mutation(({ input }) => createSiteDetail(input)),
      update: adminProcedure.input(updateSiteDetailInput).mutation(({ input }) => updateSiteDetail(input.id, input.data)),
      delete: adminProcedure.input(idInput).mutation(({ input }) => deleteSiteDetail(input.id)),
    }),
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
