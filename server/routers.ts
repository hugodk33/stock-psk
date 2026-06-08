import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, adminProcedure, managerProcedure } from "./_core/trpc";
import { loginUser, registerUser } from "./auth";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

/**
 * Router de Autenticação
 */
const authRouter = router({
  /**
   * Login com username e password
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await loginUser(input.username, input.password);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error.message || "Falha na autenticação",
        });
      }
    }),

  /**
   * Obtém dados do usuário autenticado
   */
  me: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.user!.id,
      name: ctx.user!.name,
      username: ctx.user!.username,
      role: ctx.user!.role,
      phone: ctx.user!.phone,
    };
  }),
});

/**
 * Router de Itens
 */
const itemsRouter = router({
  /**
   * Lista todos os itens
   */
  list: protectedProcedure.query(async () => {
    return await db.listItems();
  }),

  /**
   * Obtém um item por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const item = await db.getItemById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item não encontrado",
        });
      }
      return item;
    }),

  /**
   * Cria um novo item (ADMIN/MANAGER)
   */
  create: managerProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.string().min(1),
        subcategory: z.string().min(1),
        quantity: z.number().int().min(0),
        minQuantity: z.number().int().min(0),
        location: z.string().min(1),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const item = await db.createItem(input);

      // Log da ação
      await db.createLog({
        userId: ctx.user!.id,
        action: "ITEM_CREATED",
        description: `Item "${input.name}" criado`,
        itemId: item.id,
        metadata: JSON.stringify(input),
      });

      return item;
    }),

  /**
   * Atualiza um item (ADMIN/MANAGER)
   */
  update: managerProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        category: z.string().optional(),
        subcategory: z.string().optional(),
        minQuantity: z.number().int().optional(),
        location: z.string().optional(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const item = await db.updateItem(id, updateData);

      // Log da ação
      await db.createLog({
        userId: ctx.user!.id,
        action: "ITEM_UPDATED",
        description: `Item "${item.name}" atualizado`,
        itemId: id,
        metadata: JSON.stringify(updateData),
      });

      return item;
    }),

  /**
   * Deleta um item (ADMIN/MANAGER)
   */
  delete: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const item = await db.getItemById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item não encontrado",
        });
      }

      await db.deleteItem(input.id);

      // Log da ação
      await db.createLog({
        userId: ctx.user!.id,
        action: "ITEM_DELETED",
        description: `Item "${item.name}" deletado`,
        itemId: input.id,
      });

      return { success: true };
    }),

  /**
   * Entrada de estoque (aumenta quantidade)
   */
  addStock: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const item = await db.getItemById(input.itemId);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item não encontrado",
        });
      }

      const newQuantity = item.quantity + input.quantity;
      const updated = await db.updateItemQuantity(input.itemId, newQuantity);

      // Log da ação
      await db.createLog({
        userId: ctx.user!.id,
        action: "STOCK_IN",
        description: `Entrada de ${input.quantity} unidades de "${item.name}"`,
        itemId: input.itemId,
        metadata: JSON.stringify({
          previousQuantity: item.quantity,
          newQuantity,
          quantityAdded: input.quantity,
        }),
      });

      return updated;
    }),

  /**
   * Saída de estoque (diminui quantidade)
   */
  removeStock: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const item = await db.getItemById(input.itemId);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item não encontrado",
        });
      }

      if (item.quantity < input.quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quantidade insuficiente em estoque",
        });
      }

      const newQuantity = item.quantity - input.quantity;
      const updated = await db.updateItemQuantity(input.itemId, newQuantity);

      // Log da ação
      await db.createLog({
        userId: ctx.user!.id,
        action: "STOCK_OUT",
        description: `Saída de ${input.quantity} unidades de "${item.name}"`,
        itemId: input.itemId,
        metadata: JSON.stringify({
          previousQuantity: item.quantity,
          newQuantity,
          quantityRemoved: input.quantity,
        }),
      });

      return updated;
    }),
});

/**
 * Router de Rotas/Despachos
 */
const routesRouter = router({
  /**
   * Lista todas as rotas
   */
  list: protectedProcedure.query(async () => {
    return await db.listRoutes();
  }),

  /**
   * Obtém uma rota por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const route = await db.getRouteById(input.id);
      if (!route) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rota não encontrada",
        });
      }

      const items = await db.getRouteItems(input.id);
      const users = await db.getRouteUsers(input.id);

      return {
        ...route,
        items,
        users,
      };
    }),

  /**
   * Cria uma nova rota (ADMIN/MANAGER)
   */
  create: managerProcedure
    .input(
      z.object({
        name: z.string().min(1),
        scheduledDate: z.date(),
        itemIds: z.array(
          z.object({
            itemId: z.string(),
            quantity: z.number().int().min(1),
          })
        ),
        userIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const route = await db.createRoute({
        name: input.name,
        scheduledDate: input.scheduledDate,
        status: "PENDING",
        createdBy: ctx.user!.id,
      });

      // Adiciona itens à rota
      for (const item of input.itemIds) {
        await db.addItemToRoute(route.id, item.itemId, item.quantity);
      }

      // Adiciona usuários à rota
      for (const userId of input.userIds) {
        await db.addUserToRoute(route.id, userId);
      }

      // Log da ação
      await db.createLog({
        userId: ctx.user!.id,
        action: "ROUTE_CREATED",
        description: `Rota "${input.name}" criada`,
        routeId: route.id,
        metadata: JSON.stringify({
          itemCount: input.itemIds.length,
          userCount: input.userIds.length,
        }),
      });

      return route;
    }),

  /**
   * Confirma uma rota (abate estoque)
   */
  confirm: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const route = await db.getRouteById(input.id);
      if (!route) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rota não encontrada",
        });
      }

      if (route.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Apenas rotas pendentes podem ser confirmadas",
        });
      }

      // Abate o estoque de cada item
      const routeItems = await db.getRouteItems(input.id);
      const stockChanges: any[] = [];

      for (const routeItem of routeItems) {
        const item = await db.getItemById(routeItem.itemId);
        if (!item) continue;

        if (item.quantity < routeItem.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Estoque insuficiente para o item "${item.name}"`,
          });
        }

        const newQuantity = item.quantity - routeItem.quantity;
        await db.updateItemQuantity(routeItem.itemId, newQuantity);

        stockChanges.push({
          itemId: routeItem.itemId,
          itemName: item.name,
          quantityRemoved: routeItem.quantity,
          previousQuantity: item.quantity,
          newQuantity,
        });
      }

      // Atualiza status da rota
      const updated = await db.updateRouteStatus(input.id, "IN_PROGRESS");

      // Log da ação
      await db.createLog({
        userId: ctx.user!.id,
        action: "ROUTE_CONFIRMED",
        description: `Rota "${route.name}" confirmada e estoque abatido`,
        routeId: input.id,
        metadata: JSON.stringify(stockChanges),
      });

      return updated;
    }),

  /**
   * Cancela uma rota
   */
  cancel: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const route = await db.getRouteById(input.id);
      if (!route) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rota não encontrada",
        });
      }

      const updated = await db.updateRouteStatus(input.id, "CANCELLED");

      // Log da ação
      await db.createLog({
        userId: ctx.user!.id,
        action: "ROUTE_CANCELLED",
        description: `Rota "${route.name}" cancelada`,
        routeId: input.id,
      });

      return updated;
    }),
});

/**
 * Router de Usuários (ADMIN only)
 */
const usersRouter = router({
  /**
   * Lista todos os usuários
   */
  list: adminProcedure.query(async () => {
    const users = await db.listUsers();
    // Remove senhas da resposta
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }),

  /**
   * Cria um novo usuário
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phone: z.string().optional(),
        username: z.string().min(1),
        password: z.string().min(6),
        role: z.enum(["ADMIN", "MANAGER", "WORKER"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await registerUser(
          input.name,
          input.phone || null,
          input.username,
          input.password,
          input.role
        );

        // Log da ação
        await db.createLog({
          userId: ctx.user!.id,
          action: "USER_CREATED",
          description: `Usuário "${input.username}" criado com perfil ${input.role}`,
          metadata: JSON.stringify({ role: input.role }),
        });

        return user;
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Falha ao criar usuário",
        });
      }
    }),

  /**
   * Atualiza um usuário
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
        role: z.enum(["ADMIN", "MANAGER", "WORKER"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const user = await db.updateUser(id, updateData);

      // Log da ação
      await db.createLog({
        userId: ctx.user!.id,
        action: "USER_UPDATED",
        description: `Usuário "${user.username}" atualizado`,
        metadata: JSON.stringify(updateData),
      });

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        role: user.role,
      };
    }),

  /**
   * Deleta um usuário
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserById(input.id);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      await db.deleteUser(input.id);

      // Log da ação
      await db.createLog({
        userId: ctx.user!.id,
        action: "USER_DELETED",
        description: `Usuário "${user.username}" deletado`,
      });

      return { success: true };
    }),
});

/**
 * Router de Logs
 */
const logsRouter = router({
  /**
   * Lista logs com filtros
   */
  list: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        action: z.string().optional(),
        itemId: z.string().optional(),
        routeId: z.string().optional(),
        limit: z.number().int().min(1).max(1000).optional(),
        offset: z.number().int().min(0).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Workers só podem ver seus próprios logs
      const filters = {
        ...input,
        userId: ctx.user!.role === "WORKER" ? ctx.user!.id : input.userId,
      };

      return await db.listLogs(filters);
    }),
});

/**
 * Router principal
 */
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  items: itemsRouter,
  routes: routesRouter,
  users: usersRouter,
  logs: logsRouter,
});

export type AppRouter = typeof appRouter;
