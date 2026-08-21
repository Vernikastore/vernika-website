import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

const context = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext;

describe("lead capture contract", () => {
  it("requires exactly the five lead capture fields with valid values", async () => {
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
});
