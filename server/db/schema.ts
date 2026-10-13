import { bigint, int, json, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  issuer: varchar("issuer", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
}, (table) => ({ identity: uniqueIndex("users_identity_idx").on(table.issuer, table.subject) }));

export const projects = mysqlTable("projects", {
  id: varchar("id", { length: 40 }).primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  templateKey: varchar("template_key", { length: 120 }).notNull().default("knowledge-commerce"),
  status: varchar("status", { length: 40 }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const projectFiles = mysqlTable("project_files", {
  id: varchar("id", { length: 40 }).primaryKey(),
  projectId: varchar("project_id", { length: 40 }).notNull(),
  userKey: varchar("user_key", { length: 520 }).notNull(),
  objectKey: varchar("object_key", { length: 512 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 160 }).notNull(),
  sizeBytes: int("size_bytes", { unsigned: true }).notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const briefVersions = mysqlTable("brief_versions", {
  id: varchar("id", { length: 40 }).primaryKey(),
  projectId: varchar("project_id", { length: 40 }).notNull(),
  version: int("version").notNull(),
  redacted: json("redacted").notNull(),
  confirmationStatus: varchar("confirmation_status", { length: 40 }).notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const researchSources = mysqlTable("research_sources", {
  id: varchar("id", { length: 40 }).primaryKey(),
  projectId: varchar("project_id", { length: 40 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  summary: text("summary").notNull(),
  adopted: int("adopted").notNull().default(0),
  observedAt: timestamp("observed_at").defaultNow().notNull(),
});

export const generationJobs = mysqlTable("generation_jobs", {
  id: varchar("id", { length: 40 }).primaryKey(),
  projectId: varchar("project_id", { length: 40 }).notNull(),
  userKey: varchar("user_key", { length: 520 }).notNull(),
  stage: varchar("stage", { length: 80 }).notNull(),
  status: varchar("status", { length: 40 }).notNull(),
  errorCode: varchar("error_code", { length: 120 }),
  idempotencyKey: varchar("idempotency_key", { length: 120 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cleanupRecords = mysqlTable("cleanup_records", {
  id: varchar("id", { length: 40 }).primaryKey(),
  projectId: varchar("project_id", { length: 40 }).notNull(),
  deletedAt: timestamp("deleted_at").defaultNow().notNull(),
  deletedObjectCount: int("deleted_object_count").notNull().default(0),
  detail: text("detail"),
});
