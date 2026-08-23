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
});
