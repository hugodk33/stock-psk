import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context com usuário autenticado
function createMockContext(role: "ADMIN" | "MANAGER" | "WORKER" = "MANAGER"): TrpcContext {
  return {
    user: {
      id: "test-user-1",
      openId: "test-user-1",
      name: "Test User",
      email: "test@example.com",
      username: "testuser",
      loginMethod: "local",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {} as any,
  };
}

describe("Items Router", () => {
  it("should list all items", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const items = await caller.items.list();
    expect(Array.isArray(items)).toBe(true);
  });

  it("should get item by id", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const items = await caller.items.list();
    if (items.length > 0) {
      const item = await caller.items.getById({ id: items[0].id });
      expect(item).toBeDefined();
      expect(item?.id).toBe(items[0].id);
    }
  });

  it("should create item with MANAGER role", async () => {
    const ctx = createMockContext("MANAGER");
    const caller = appRouter.createCaller(ctx);

    const newItem = await caller.items.create({
      name: "Test Item",
      category: "Test Category",
      subcategory: "Test Subcategory",
      quantity: 10,
      minQuantity: 5,
      location: "A-01",
    });

    expect(newItem).toBeDefined();
    expect(newItem.name).toBe("Test Item");
    expect(newItem.quantity).toBe(10);
  });

  it("should not allow WORKER to create items", async () => {
    const ctx = createMockContext("WORKER");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.items.create({
        name: "Test Item",
        category: "Test Category",
        subcategory: "Test Subcategory",
        quantity: 10,
        minQuantity: 5,
        location: "A-01",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should add stock to item", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const items = await caller.items.list();
    if (items.length > 0) {
      const originalQty = items[0].quantity;
      const result = await caller.items.addStock({
        itemId: items[0].id,
        quantity: 5,
      });

      expect(result.quantity).toBe(originalQty + 5);
    }
  });

  it("should remove stock from item", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const items = await caller.items.list();
    if (items.length > 0) {
      const originalQty = items[0].quantity;
      if (originalQty > 0) {
        const result = await caller.items.removeStock({
          itemId: items[0].id,
          quantity: 1,
        });

        expect(result.quantity).toBe(originalQty - 1);
      }
    }
  });
});

describe("Logs Router", () => {
  it("should list logs", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.logs.list({ limit: 10 });
    expect(Array.isArray(logs)).toBe(true);
  });

  it("should list logs with item filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const items = await caller.items.list();
    if (items.length > 0) {
      const logs = await caller.logs.list({
        itemId: items[0].id,
        limit: 10,
      });
      expect(Array.isArray(logs)).toBe(true);
    }
  });
});

describe("Users Router", () => {
  it("should list users with ADMIN role", async () => {
    const ctx = createMockContext("ADMIN");
    const caller = appRouter.createCaller(ctx);

    const users = await caller.users.list();
    expect(Array.isArray(users)).toBe(true);
  });

  it("should not allow non-ADMIN to list users", async () => {
    const ctx = createMockContext("MANAGER");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.users.list();
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});
