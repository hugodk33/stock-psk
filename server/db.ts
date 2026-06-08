import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import {
  users,
  items,
  routes,
  routeItems,
  routeUsers,
  logs,
  type InsertUser,
  type InsertItem,
  type InsertRoute,
  type InsertLog,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Inicializa a conexão com o banco de dados SQLite
 */
export async function getDb() {
  if (!_db) {
    try {
      const dbPath = process.env.DATABASE_URL || "inventory.db";
      const sqlite = new Database(dbPath);
      _db = drizzle(sqlite);
      console.log(`[Database] Connected to SQLite at ${dbPath}`);
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Cria um novo usuário
 */
export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values(user).returning();
  return result[0];
}

/**
 * Busca usuário por username
 */
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

/**
 * Busca usuário por ID
 */
export async function getUserById(id: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Lista todos os usuários
 */
export async function listUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users);
}

/**
 * Atualiza um usuário
 */
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

/**
 * Deleta um usuário
 */
export async function deleteUser(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(users).where(eq(users.id, id));
}

/**
 * Cria um novo item
 */
export async function createItem(item: InsertItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(items).values(item).returning();
  return result[0];
}

/**
 * Lista todos os itens
 */
export async function listItems() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(items);
}

/**
 * Busca item por ID
 */
export async function getItemById(id: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Atualiza um item
 */
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

/**
 * Deleta um item
 */
export async function deleteItem(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(items).where(eq(items.id, id));
}

/**
 * Atualiza quantidade de um item
 */
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

/**
 * Cria uma nova rota
 */
export async function createRoute(route: InsertRoute) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(routes).values(route).returning();
  return result[0];
}

/**
 * Lista todas as rotas
 */
export async function listRoutes() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(routes);
}

/**
 * Busca rota por ID
 */
export async function getRouteById(id: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(routes)
    .where(eq(routes.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Atualiza status de uma rota
 */
export async function updateRouteStatus(
  id: string,
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(routes)
    .set({ status, updatedAt: new Date() })
    .where(eq(routes.id, id))
    .returning();

  return result[0];
}

/**
 * Adiciona item a uma rota
 */
export async function addItemToRoute(routeId: string, itemId: string, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(routeItems)
    .values({ routeId, itemId, quantity })
    .returning();

  return result[0];
}

/**
 * Lista itens de uma rota
 */
export async function getRouteItems(routeId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(routeItems)
    .where(eq(routeItems.routeId, routeId));
}

/**
 * Adiciona usuário a uma rota
 */
export async function addUserToRoute(routeId: string, userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(routeUsers)
    .values({ routeId, userId })
    .returning();

  return result[0];
}

/**
 * Lista usuários de uma rota
 */
export async function getRouteUsers(routeId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(routeUsers)
    .where(eq(routeUsers.routeId, routeId));
}

/**
 * Cria um novo log
 */
export async function createLog(log: InsertLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(logs).values(log).returning();
  return result[0];
}

/**
 * Lista logs com filtros opcionais
 */
export async function listLogs(filters?: {
  userId?: string;
  action?: string;
  itemId?: string;
  routeId?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.userId) conditions.push(eq(logs.userId, filters.userId));
  if (filters?.itemId) conditions.push(eq(logs.itemId, filters.itemId));
  if (filters?.routeId) conditions.push(eq(logs.routeId, filters.routeId));

  let query = db.select().from(logs);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const result = await (query as any)
    .orderBy(logs.createdAt)
    .limit(filters?.limit || 100)
    .offset(filters?.offset || 0);

  return result;
}
