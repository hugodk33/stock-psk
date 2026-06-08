/**
 * SDK simplificado para autenticação local
 * Substitui o OAuth service para o sistema de estoque
 */

import type { Request } from "express";
import { getUserById } from "../db";
import { verifyToken } from "../auth";
import type { User } from "../../drizzle/schema";

export type AuthenticatedUser = User;

class LocalAuthService {
  /**
   * Autentica uma requisição baseado no token JWT no header
   */
  async authenticateRequest(req: Request): Promise<AuthenticatedUser | null> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
      }

      const token = authHeader.slice(7); // Remove "Bearer "
      const decoded = verifyToken(token);

      if (!decoded) {
        return null;
      }

      const user = await getUserById(decoded.id);

      if (!user) {
        return null;
      }

      return user;
    } catch (error) {
      console.error("[Auth] Failed to authenticate request:", error);
      return null;
    }
  }
}

export const sdk = new LocalAuthService();
