import { pgTable, text, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  phone: text("phone"),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["ADMIN", "MANAGER", "WORKER"] })
    .notNull()
    .default("WORKER"),
  createdAt: timestamp("createdAt", { mode: "date" })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .default(sql`now()`),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const items = pgTable("items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  imageUrl: text("imageUrl"),
  category: text("category").notNull(),
  subcategory: text("subcategory").notNull(),
  quantity: integer("quantity").notNull().default(0),
  minQuantity: integer("minQuantity").notNull().default(5),
  location: text("location").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .default(sql`now()`),
});

export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;

export const logs = pgTable("logs", {
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
  metadata: text("metadata"),
  createdAt: timestamp("createdAt", { mode: "date" })
    .notNull()
    .default(sql`now()`),
});

export type Log = typeof logs.$inferSelect;
export type InsertLog = typeof logs.$inferInsert;
