import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, inquiries, InsertLead, leads, newsletterSubscribers, users, InsertConsultationRequest, consultationRequests, caseStudies, InsertCaseStudy, projects, InsertProject, siteDetails, InsertSiteDetail } from "../drizzle/schema";
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

export async function listCaseStudies(publishedOnly = false) {
  const db = await getDb();
  if (!db) return [];
  return publishedOnly ? db.select().from(caseStudies).where(eq(caseStudies.isPublished, 1)).orderBy(asc(caseStudies.displayOrder), desc(caseStudies.createdAt)) : db.select().from(caseStudies).orderBy(asc(caseStudies.displayOrder), desc(caseStudies.createdAt));
}

export async function createCaseStudy(input: Omit<InsertCaseStudy, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(caseStudies).values(input);
  return { success: true } as const;
}

export async function updateCaseStudy(id: number, input: Partial<Omit<InsertCaseStudy, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(caseStudies).set(input).where(eq(caseStudies.id, id));
  return { success: true } as const;
}

export async function deleteCaseStudy(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(caseStudies).where(eq(caseStudies.id, id));
  return { success: true } as const;
}

export async function reorderCaseStudies(items: Array<{ id: number; displayOrder: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  for (const item of items) await db.update(caseStudies).set({ displayOrder: item.displayOrder }).where(eq(caseStudies.id, item.id));
  return { success: true } as const;
}

export async function listProjects(publishedOnly = false) {
  const db = await getDb();
  if (!db) return [];
  return publishedOnly ? db.select().from(projects).where(eq(projects.isPublished, 1)).orderBy(asc(projects.displayOrder), desc(projects.createdAt)) : db.select().from(projects).orderBy(asc(projects.displayOrder), desc(projects.createdAt));
}

export async function createProject(input: Omit<InsertProject, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(projects).values(input);
  return { success: true } as const;
}

export async function updateProject(id: number, input: Partial<Omit<InsertProject, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(projects).set(input).where(eq(projects.id, id));
  return { success: true } as const;
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(projects).where(eq(projects.id, id));
  return { success: true } as const;
}

export async function reorderProjects(items: Array<{ id: number; displayOrder: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  for (const item of items) await db.update(projects).set({ displayOrder: item.displayOrder }).where(eq(projects.id, item.id));
  return { success: true } as const;
}

export async function listSiteDetails(publishedOnly = false) {
  const db = await getDb();
  if (!db) return [];
  return publishedOnly ? db.select().from(siteDetails).where(eq(siteDetails.isPublished, 1)).orderBy(desc(siteDetails.createdAt)) : db.select().from(siteDetails).orderBy(desc(siteDetails.createdAt));
}

export async function createSiteDetail(input: Omit<InsertSiteDetail, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(siteDetails).values(input);
  return { success: true } as const;
}

export async function updateSiteDetail(id: number, input: Partial<Omit<InsertSiteDetail, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(siteDetails).set(input).where(eq(siteDetails.id, id));
  return { success: true } as const;
}

export async function deleteSiteDetail(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(siteDetails).where(eq(siteDetails.id, id));
  return { success: true } as const;
}

const csvCell = (value: unknown) => `"${(value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value)).replace(/"/g, '""')}"`;

export async function exportLeadAndConsultationCsv() {
  const [leadRows, consultationRows] = await Promise.all([listLeads(), listConsultationRequests()]);
  const header = ["recordType", "id", "name", "email", "phone", "company", "companySize", "interestArea", "leadStatus", "scheduledAt", "timezone", "consultationStatus", "createdAt"];
  const rows = [
    ...leadRows.map(lead => ["lead", lead.id, lead.name, lead.email, lead.phone, lead.company, lead.companySize, lead.interestArea, lead.status, "", "", "", lead.createdAt]),
    ...consultationRows.map(item => ["consultation", item.id, item.name, item.email, "", item.company ?? "", "", "", "", item.scheduledAt, item.timezone, item.status, item.createdAt]),
  ];
  return [header, ...rows].map(row => row.map(csvCell).join(",")).join("\n");
}
