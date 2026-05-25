import "server-only";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  // DATABASE_URL is "file:./path" — strip the "file:" prefix for better-sqlite3
  const filePath = dbUrl.replace(/^file:/, "");
  const adapter = new PrismaBetterSqlite3({ url: filePath });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
