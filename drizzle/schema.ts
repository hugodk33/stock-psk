import {
  integer,
  text,
  sqliteTable,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Users table — Autenticação e controle de acesso
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone"),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // bcrypt hash
  role: text("role", { enum: ["ADMIN", "MANAGER", "WORKER"] })
    .notNull()
    .default("WORKER"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('now') * 1000 as integer))`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('now') * 1000 as integer))`),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Items table — Itens de manutenção no armazém
 */
export const items = sqliteTable("items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  imageUrl: text("imageUrl"), // URL do S3
  category: text("category").notNull(),
  subcategory: text("subcategory").notNull(),
  quantity: integer("quantity").notNull().default(0),
  minQuantity: integer("minQuantity").notNull().default(5),
  location: text("location").notNull(), // Ex: "A-12", "Corredor B"
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('now') * 1000 as integer))`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('now') * 1000 as integer))`),
});

export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;

/**
 * Logs table — Histórico de ações do sistema
 */
export const logs = sqliteTable("logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  action: text("action", {
    enum: [
      "ITEM_CREATED",
      "ITEM_UPDATED",
      "ITEM_DELETED",
      "STOCK_IN",
      "STOCK_OUT",
      "USER_CREATED",
      "USER_UPDATED",
      "USER_DELETED",
    ],
  }).notNull(),
  description: text("description").notNull(),
  itemId: text("itemId").references(() => items.id),
  metadata: text("metadata"), // JSON string
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('now') * 1000 as integer))`),
});

export type Log = typeof logs.$inferSelect;
export type InsertLog = typeof logs.$inferInsert;
