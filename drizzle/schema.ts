import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  company: varchar("company", { length: 160 }).notNull(),
  companySize: varchar("companySize", { length: 80 }).notNull(),
  interestArea: varchar("interestArea", { length: 120 }).notNull(),
  source: varchar("source", { length: 40 }).default("website").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 160 }),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const consultationRequests = mysqlTable("consultationRequests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 160 }),
  scheduledAt: timestamp("scheduledAt").notNull(),
  timezone: varchar("timezone", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["requested", "confirmed", "completed", "cancelled"]).default("requested").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const caseStudies = mysqlTable("caseStudies", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  clientName: varchar("clientName", { length: 160 }).notNull(),
  industry: varchar("industry", { length: 120 }).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  metric: varchar("metric", { length: 80 }).notNull(),
  metricLabel: varchar("metricLabel", { length: 160 }).notNull(),
  description: text("description").notNull(),
  challenge: text("challenge").notNull(),
  solution: text("solution").notNull(),
  outcome: text("outcome").notNull(),
  isPublished: int("isPublished").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 120 }).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description").notNull(),
  impact: varchar("impact", { length: 160 }).notNull(),
  status: varchar("status", { length: 80 }).default("Active").notNull(),
  isPublished: int("isPublished").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const siteDetails = mysqlTable("siteDetails", {
  id: int("id").autoincrement().primaryKey(),
  detailKey: varchar("detailKey", { length: 160 }).notNull().unique(),
  label: varchar("label", { length: 160 }).notNull(),
  value: text("value").notNull(),
  isPublished: int("isPublished").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type ConsultationRequest = typeof consultationRequests.$inferSelect;
export type InsertConsultationRequest = typeof consultationRequests.$inferInsert;
export type CaseStudy = typeof caseStudies.$inferSelect;
export type InsertCaseStudy = typeof caseStudies.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type SiteDetail = typeof siteDetails.$inferSelect;
export type InsertSiteDetail = typeof siteDetails.$inferInsert;
