import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL || process.env.DB_STRING || "";
if (!connectionString) {
  throw new Error("DATABASE_URL or DB_STRING is required to run drizzle commands");
}

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

const url = connectionString.startsWith("postgresql://") || connectionString.startsWith("postgres://")
  ? connectionString
  : parseDbString(connectionString);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
