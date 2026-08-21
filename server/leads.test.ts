import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context = { user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } satisfies TrpcContext;

describe("lead capture contract", () => {
  it("requires exactly the five lead capture fields with valid values", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.leads.create({ name: "A", email: "bad", phone: "1", company: "", interestArea: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("does not expose admin leads to anonymous visitors", async () => {
    const caller = appRouter.createCaller(context);
    await expect(caller.leads.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
