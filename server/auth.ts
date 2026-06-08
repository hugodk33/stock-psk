import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getUserByUsername, createUser } from "./db";
import type { User } from "../drizzle/schema";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-production";
const JWT_EXPIRATION = "24h";
const BCRYPT_ROUNDS = 12;

/**
 * Faz hash da senha com bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compara senha com hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Gera JWT token
 */
export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
}

/**
 * Verifica e decodifica JWT token
 */
export function verifyToken(token: string): { id: string; username: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Faz login do usuário
 */
export async function loginUser(username: string, password: string) {
  const user = await getUserByUsername(username);

  if (!user) {
    throw new Error("Usuário ou senha inválidos");
  }

  const isPasswordValid = await verifyPassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Usuário ou senha inválidos");
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  };
}

/**
 * Registra novo usuário (apenas ADMIN pode fazer isso)
 */
export async function registerUser(
  name: string,
  phone: string | null,
  username: string,
  password: string,
  role: "ADMIN" | "MANAGER" | "WORKER" = "WORKER"
) {
  // Verifica se usuário já existe
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    throw new Error("Usuário já existe");
  }

  // Faz hash da senha
  const hashedPassword = await hashPassword(password);

  // Cria novo usuário
  const newUser = await createUser({
    name,
    phone: phone || null,
    username,
    password: hashedPassword,
    role,
  });

  return {
    id: newUser.id,
    name: newUser.name,
    username: newUser.username,
    role: newUser.role,
  };
}
