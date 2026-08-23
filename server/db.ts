import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, inquiries, InsertLead, leads, newsletterSubscribers, users, InsertConsultationRequest, consultationRequests } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) { values.role = user.role ?? "admin"; updateSet.role = values.role; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createLead(input: Omit<InsertLead, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(leads).values(input);
  return { success: true } as const;
}

export async function listLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function updateLeadStatus(id: number, status: "new" | "contacted" | "qualified" | "closed") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(leads).set({ status }).where(eq(leads.id, id));
  return { success: true } as const;
}

export async function createInquiry(input: { name: string; email: string; company?: string | null; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(inquiries).values(input);
  return { success: true } as const;
}

export async function subscribeNewsletter(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(newsletterSubscribers).values({ email }).onDuplicateKeyUpdate({ set: { email } });
  return { success: true } as const;
}

export async function createConsultationRequest(input: Omit<InsertConsultationRequest, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(consultationRequests).values(input);
  return { success: true } as const;
}

export async function listConsultationRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(consultationRequests).orderBy(desc(consultationRequests.createdAt));
}

export async function updateConsultationStatus(id: number, status: "requested" | "confirmed" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(consultationRequests).set({ status }).where(eq(consultationRequests.id, id));
  return { success: true } as const;
}
