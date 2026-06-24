import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, adminProcedure, managerProcedure } from "./_core/trpc";
import { loginUser, registerUser } from "./auth";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

const RECAPTCHA_SECRET = process.env.SECRET_KEY_RECAPTCHA;

async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET) return true;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

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
        recaptchaToken: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (input.recaptchaToken) {
          const valid = await verifyRecaptcha(input.recaptchaToken);
          if (!valid) {
            throw new Error("reCAPTCHA inválido");
          }
        }
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
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().int().min(1).max(1000).optional(),
        offset: z.number().int().min(0).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Workers só podem ver seus próprios logs
      const filters: Record<string, any> = {
        ...input,
        userId: ctx.user!.role === "WORKER" ? ctx.user!.id : input.userId,
      };
      if (filters.dateFrom) filters.dateFrom = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        end.setHours(23, 59, 59, 999);
        filters.dateTo = end;
      }

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
  users: usersRouter,
  logs: logsRouter,
});

export type AppRouter = typeof appRouter;
