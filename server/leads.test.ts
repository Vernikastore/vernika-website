import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

const context = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext;
const adminContext = { user: { id: 1, openId: "owner", name: "Vernika Owner", email: "owner@example.com", loginMethod: "manus", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext;

describe("lead capture contract", () => {
  it("requires the six lead capture fields with valid values", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.leads.create({ name: "A", email: "bad", phone: "1", company: "", companySize: "", interestArea: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("does not expose admin leads to anonymous visitors", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.leads.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("persists a complete lead with the exact submitted fields", async () => {
    const persist = vi.spyOn(db, "createLead").mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(context);
    const input = { name: "Test User", email: "test@vernika.com", phone: "+919876543210", company: "Vernika Test Labs", companySize: "11–50", interestArea: "Automation" };
    const result = await caller.leads.create(input);
    expect(result).toEqual({ success: true });
    expect(persist).toHaveBeenCalledWith({ ...input, source: "website", status: "new" });
    persist.mockRestore();
  });

  it("validates and persists a future consultation request", async () => {
    const persist = vi.spyOn(db, "createConsultationRequest").mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(context);
    const scheduledAt = new Date(Date.now() + 86400000);
    const input = { name: "Future Client", email: "client@vernika.com", company: "Future Co", scheduledAt, timezone: "Asia/Kolkata" };
    const result = await caller.consultations.create(input);
    expect(result).toEqual({ success: true });
    expect(persist).toHaveBeenCalledWith({ ...input, status: "requested" });
    persist.mockRestore();
  });

  it("rejects consultation requests in the past", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.consultations.create({ name: "Past Client", email: "past@vernika.com", scheduledAt: new Date(Date.now() - 60000), timezone: "UTC" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("blocks anonymous visitors from listing consultation requests", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.consultations.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks non-admin users from updating consultation requests", async () => {
    const userContext = { ...context, user: { id: 2, openId: "member", name: "Member", email: "member@example.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } } satisfies TrpcContext;
    const caller = appRouter.createCaller(userContext);
    await expect(caller.consultations.updateStatus({ id: 7, status: "confirmed" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows admins to list and update consultation requests", async () => {
    const list = vi.spyOn(db, "listConsultationRequests").mockResolvedValue([]);
    const update = vi.spyOn(db, "updateConsultationStatus").mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(adminContext);
    expect(await caller.consultations.list()).toEqual([]);
    await caller.consultations.updateStatus({ id: 7, status: "confirmed" });
    expect(update).toHaveBeenCalledWith(7, "confirmed");
    list.mockRestore();
    update.mockRestore();
  });

  it("protects the CSV export and content mutations for admins", async () => {
    const anonymousCaller = appRouter.createCaller(context);
    await expect(anonymousCaller.admin.exportCsv()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(anonymousCaller.admin.projects.create({ name: "New project", category: "Automation", title: "Useful project", description: "A useful project description.", impact: "Faster work", status: "Active", isPublished: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });

    const exportCsv = vi.spyOn(db, "exportLeadAndConsultationCsv").mockResolvedValue("recordType,id\\nlead,1");
    const createProject = vi.spyOn(db, "createProject").mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(adminContext);
    expect(await caller.admin.exportCsv()).toBe("recordType,id\\nlead,1");
    const project = { name: "New project", category: "Automation", title: "Useful project", description: "A useful project description.", impact: "Faster work", status: "Active", isPublished: 1 };
    await caller.admin.projects.create(project);
    expect(createProject).toHaveBeenCalledWith(project);
    exportCsv.mockRestore();
    createProject.mockRestore();
  });

  it("allows admins to create and update editable site details", async () => {
    const create = vi.spyOn(db, "createSiteDetail").mockResolvedValue({ success: true });
    const update = vi.spyOn(db, "updateSiteDetail").mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(adminContext);
    const detail = { detailKey: "hero.headline", label: "Hero headline", value: "A clear public headline.", isPublished: 1 };
    await caller.admin.siteDetails.create(detail);
    await caller.admin.siteDetails.update({ id: 3, data: { value: "An updated public headline." } });
    expect(create).toHaveBeenCalledWith(detail);
    expect(update).toHaveBeenCalledWith(3, { value: "An updated public headline.", isPublished: 1 });
    create.mockRestore();
    update.mockRestore();
  });

  it("covers owner-only CRUD for every managed content type", async () => {
    const createCaseStudy = vi.spyOn(db, "createCaseStudy").mockResolvedValue({ success: true });
    const updateCaseStudy = vi.spyOn(db, "updateCaseStudy").mockResolvedValue({ success: true });
    const deleteCaseStudy = vi.spyOn(db, "deleteCaseStudy").mockResolvedValue({ success: true });
    const updateProject = vi.spyOn(db, "updateProject").mockResolvedValue({ success: true });
    const deleteProject = vi.spyOn(db, "deleteProject").mockResolvedValue({ success: true });
    const deleteSiteDetail = vi.spyOn(db, "deleteSiteDetail").mockResolvedValue({ success: true });
    const caseStudy = { slug: "test-story", clientName: "Test Client", industry: "Retail", title: "A useful transformation", metric: "2x", metricLabel: "faster handoffs", description: "A detailed transformation story for a local business.", challenge: "The team needed a clear operating rhythm.", solution: "We connected the workflow around one shared system.", outcome: "The team now has a calmer, clearer way to operate.", isPublished: 1 };
    const project = { name: "Test Project", category: "CRM", title: "A useful project", description: "A detailed project description for a local business.", impact: "Faster follow-up", status: "Active", isPublished: 1 };
    const caller = appRouter.createCaller(adminContext);
    await caller.admin.caseStudies.create(caseStudy);
    await caller.admin.caseStudies.update({ id: 4, data: { title: "An updated transformation" } });
    await caller.admin.caseStudies.delete({ id: 4 });
    await caller.admin.projects.update({ id: 5, data: { status: "Archived" } });
    await caller.admin.projects.delete({ id: 5 });
    await caller.admin.siteDetails.delete({ id: 6 });
    expect(createCaseStudy).toHaveBeenCalledWith(caseStudy);
    expect(updateCaseStudy).toHaveBeenCalledWith(4, { title: "An updated transformation", isPublished: 1 });
    expect(deleteCaseStudy).toHaveBeenCalledWith(4);
    expect(updateProject).toHaveBeenCalledWith(5, { status: "Archived", isPublished: 1 });
    expect(deleteProject).toHaveBeenCalledWith(5);
    expect(deleteSiteDetail).toHaveBeenCalledWith(6);
    const anonymousCaller = appRouter.createCaller(context);
    await expect(anonymousCaller.admin.caseStudies.create(caseStudy)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(anonymousCaller.admin.caseStudies.update({ id: 4, data: { title: "Blocked update" } })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(anonymousCaller.admin.caseStudies.delete({ id: 4 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(anonymousCaller.admin.projects.create(project)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(anonymousCaller.admin.projects.update({ id: 5, data: { status: "Blocked" } })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(anonymousCaller.admin.projects.delete({ id: 5 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const siteDetail = { detailKey: "footer.note", label: "Footer note", value: "A public footer note for testing.", isPublished: 1 };
    await expect(anonymousCaller.admin.siteDetails.create(siteDetail)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(anonymousCaller.admin.siteDetails.update({ id: 6, data: { value: "Blocked update" } })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(anonymousCaller.admin.siteDetails.delete({ id: 6 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const nonAdminCaller = appRouter.createCaller({ ...context, user: { id: 2, openId: "member-content", name: "Member", email: "member@example.com", loginMethod: "manus", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } });
    await expect(nonAdminCaller.admin.caseStudies.create(caseStudy)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(nonAdminCaller.admin.caseStudies.update({ id: 4, data: { title: "Blocked update" } })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(nonAdminCaller.admin.caseStudies.delete({ id: 4 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(nonAdminCaller.admin.projects.create(project)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(nonAdminCaller.admin.projects.update({ id: 5, data: { status: "Blocked" } })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(nonAdminCaller.admin.projects.delete({ id: 5 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(nonAdminCaller.admin.siteDetails.create(siteDetail)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(nonAdminCaller.admin.siteDetails.update({ id: 6, data: { value: "Blocked update" } })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(nonAdminCaller.admin.siteDetails.delete({ id: 6 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    createCaseStudy.mockRestore();
    updateCaseStudy.mockRestore();
    deleteCaseStudy.mockRestore();
    updateProject.mockRestore();
    deleteProject.mockRestore();
    deleteSiteDetail.mockRestore();
  });
});
