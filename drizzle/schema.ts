import {
  integer,
  text,
  sqliteTable,
  primaryKey,
  AnySQLiteColumn,
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
 * Routes table — Rotas de despacho
 */
export const routes = sqliteTable("routes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  scheduledDate: integer("scheduledDate", { mode: "timestamp_ms" }).notNull(),
  status: text("status", {
    enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  })
    .notNull()
    .default("PENDING"),
  createdBy: text("createdBy")
    .notNull()
    .references(() => users.id),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('now') * 1000 as integer))`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('now') * 1000 as integer))`),
});

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;

/**
 * RouteItems table — Relacionamento N:M entre rotas e itens
 */
export const routeItems = sqliteTable(
  "routeItems",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    routeId: text("routeId")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    itemId: text("itemId")
      .notNull()
      .references(() => items.id),
    quantity: integer("quantity").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.routeId, table.itemId] }),
  })
);

export type RouteItem = typeof routeItems.$inferSelect;
export type InsertRouteItem = typeof routeItems.$inferInsert;

/**
 * RouteUsers table — Relacionamento N:M entre rotas e usuários
 */
export const routeUsers = sqliteTable(
  "routeUsers",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    routeId: text("routeId")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.routeId, table.userId] }),
  })
);

export type RouteUser = typeof routeUsers.$inferSelect;
export type InsertRouteUser = typeof routeUsers.$inferInsert;

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
      "ROUTE_CREATED",
      "ROUTE_CONFIRMED",
      "ROUTE_CANCELLED",
      "USER_CREATED",
      "USER_UPDATED",
      "USER_DELETED",
    ],
  }).notNull(),
  description: text("description").notNull(),
  itemId: text("itemId").references(() => items.id),
  routeId: text("routeId").references(() => routes.id),
  metadata: text("metadata"), // JSON string
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(cast(unixepoch('now') * 1000 as integer))`),
});

export type Log = typeof logs.$inferSelect;
export type InsertLog = typeof logs.$inferInsert;
