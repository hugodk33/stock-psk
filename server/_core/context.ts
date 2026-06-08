import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserById } from "../db";
import { verifyToken } from "../auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Extrai o token JWT do header Authorization
 */
function getTokenFromHeader(req: CreateExpressContextOptions["req"]): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7); // Remove "Bearer "
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null | undefined = undefined;

  try {
    const token = getTokenFromHeader(opts.req);

    if (token) {
      const decoded = verifyToken(token);

      if (decoded) {
        user = await getUserById(decoded.id);
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user: user ?? null,
  };
}
