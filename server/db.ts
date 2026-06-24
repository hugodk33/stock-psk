import { eq, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  users,
  items,
  logs,
  type InsertUser,
  type InsertItem,
  type InsertLog,
} from "../drizzle/schema";

function parseDbString(str: string): string {
  const parts = str.split(";").reduce<Record<string, string>>((acc, part) => {
    const idx = part.indexOf("=");
    if (idx > 0) {
      const key = part.slice(0, idx).trim().toLowerCase();
      const val = part.slice(idx + 1).trim();
      acc[key] = val;
    }
    return acc;
  }, {});
  const password = encodeURIComponent(parts["password"] || "");
  return `postgresql://${parts["user id"] || parts["user"]}:${password}@${parts["server"] || parts["host"]}:${parts["port"] || 5432}/${parts["database"] || parts["db"]}`;
}

function buildConnectionString(): string {
  const raw = process.env.DATABASE_URL || process.env.DB_STRING || "";
  if (!raw) return "postgresql://localhost:5432/stock";
  if (raw.startsWith("postgresql://") || raw.startsWith("postgres://")) return raw;
  return parseDbString(raw);
}

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

export async function getDb() {
  if (!_db) {
    try {
      const connectionString = buildConnectionString();
      _pool = new Pool({ connectionString });
      _db = drizzle(_pool);
      console.log(`[Database] Connected to PostgreSQL`);
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values(user).returning();
  return result[0];
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users);
}

export async function updateUser(id: string, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return result[0];
}

export async function deleteUser(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, id));
}

export async function createItem(item: InsertItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(items).values(item).returning();
  return result[0];
}

export async function listItems() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(items);
}

export async function getItemById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateItem(id: string, data: Partial<InsertItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(items)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(items.id, id))
    .returning();
  return result[0];
}

export async function deleteItem(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(items).where(eq(items.id, id));
}

export async function updateItemQuantity(id: string, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(items)
    .set({ quantity, updatedAt: new Date() })
    .where(eq(items.id, id))
    .returning();
  return result[0];
}

export async function createLog(log: InsertLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(logs).values(log).returning();
  return result[0];
}

export type LogWithUser = {
  id: string;
  userId: string;
  userName: string | null;
  action: string;
  description: string;
  itemId: string | null;
  metadata: string | null;
  createdAt: Date;
};

export async function listLogs(filters?: {
  userId?: string;
  action?: string;
  itemId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}): Promise<LogWithUser[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.userId) conditions.push(eq(logs.userId, filters.userId));
  if (filters?.itemId) conditions.push(eq(logs.itemId, filters.itemId));
  if (filters?.dateFrom) conditions.push(gte(logs.createdAt, filters.dateFrom));
  if (filters?.dateTo) conditions.push(lte(logs.createdAt, filters.dateTo));

  const query = db
    .select({
      id: logs.id,
      userId: logs.userId,
      userName: users.name,
      action: logs.action,
      description: logs.description,
      itemId: logs.itemId,
      metadata: logs.metadata,
      createdAt: logs.createdAt,
    })
    .from(logs)
    .leftJoin(users, eq(logs.userId, users.id));

  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;

  const result = await (filtered as any)
    .orderBy(logs.createdAt)
    .limit(filters?.limit || 100)
    .offset(filters?.offset || 0);
  return result;
}
