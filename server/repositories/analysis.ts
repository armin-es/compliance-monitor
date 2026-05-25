import "server-only";
import { db } from "@/server/db";
import type { Analysis } from "@/types";

function serialize(row: {
  id: string;
  userId: string;
  action: string;
  guideline: string;
  result: string;
  confidence: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Analysis {
  return {
    id: row.id,
    userId: row.userId,
    action: row.action,
    guideline: row.guideline,
    result: row.result as Analysis["result"],
    confidence: row.confidence,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAnalyses(userId: string): Promise<Analysis[]> {
  const rows = await db.analysis.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serialize);
}

export async function getAnalysisById(
  id: string,
  userId: string
): Promise<Analysis | null> {
  const row = await db.analysis.findFirst({
    where: { id, userId, deletedAt: null },
  });
  return row ? serialize(row) : null;
}

export async function createAnalysis(data: {
  userId: string;
  action: string;
  guideline: string;
  result: string;
  confidence: number;
}): Promise<Analysis> {
  const row = await db.analysis.create({ data });
  return serialize(row);
}

export async function updateAnalysis(
  id: string,
  userId: string,
  data: {
    action: string;
    guideline: string;
    result: string;
    confidence: number;
  }
): Promise<Analysis | null> {
  const existing = await db.analysis.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) return null;

  const row = await db.analysis.update({ where: { id }, data });
  return serialize(row);
}

export async function softDeleteAnalysis(
  id: string,
  userId: string
): Promise<boolean> {
  const existing = await db.analysis.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) return false;

  await db.analysis.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return true;
}
