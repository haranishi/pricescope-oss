import { and, count, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { appraisals } from "@/db/schema";
import type { CategoryKey, Factor, ItemInput, Todo } from "@/lib/estimator";

export const APPRAISALS_PAGE_SIZE = 20;

export type AppraisalListItem = {
  id: string;
  itemName: string;
  category: CategoryKey;
  recommendedPrice: number;
  score: number;
  soldPrice: number | null;
  createdAt: string;
};

export type AppraisalDetail = AppraisalListItem & {
  input: ItemInput;
  result: {
    recommended: number;
    quick: number;
    market: number;
    premium: number;
    low: number;
    high: number;
    score: number;
    confidence: number;
  };
  logicVersion: string;
  quickPrice: number;
  marketPrice: number;
  premiumPrice: number;
  rangeLow: number;
  rangeHigh: number;
  confidence: number;
  factors: Factor[];
  todos: Todo[];
  listingTitle: string | null;
  listingDescription: string | null;
  copySource: string | null;
  daysToSell: number | null;
  discountCount: number | null;
  soldReportedAt: string | null;
};

export async function listAppraisals(
  userId: string,
  filters: { page: number; q?: string; category?: CategoryKey },
) {
  const conditions = [eq(appraisals.userId, userId)];
  if (filters.q) conditions.push(ilike(appraisals.itemName, `%${filters.q}%`));
  if (filters.category) conditions.push(eq(appraisals.category, filters.category));
  const where = and(...conditions);
  const offset = (filters.page - 1) * APPRAISALS_PAGE_SIZE;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: appraisals.id,
        itemName: appraisals.itemName,
        category: appraisals.category,
        recommendedPrice: appraisals.recommendedPrice,
        score: appraisals.score,
        soldPrice: appraisals.soldPrice,
        createdAt: appraisals.createdAt,
      })
      .from(appraisals)
      .where(where)
      .orderBy(desc(appraisals.createdAt), desc(appraisals.id))
      .limit(APPRAISALS_PAGE_SIZE)
      .offset(offset),
    db.select({ value: count() }).from(appraisals).where(where),
  ]);

  const total = countRows[0]?.value ?? 0;
  return {
    items: rows.map((row) => ({
      ...row,
      category: row.category as CategoryKey,
      createdAt: row.createdAt.toISOString(),
    })),
    page: filters.page,
    pageSize: APPRAISALS_PAGE_SIZE,
    total,
    hasNext: offset + rows.length < total,
  };
}

export async function getAppraisal(userId: string, id: string): Promise<AppraisalDetail | null> {
  const [row] = await db
    .select()
    .from(appraisals)
    .where(and(eq(appraisals.id, id), eq(appraisals.userId, userId)))
    .limit(1);

  if (!row) return null;
  return {
    id: row.id,
    itemName: row.itemName,
    category: row.category as CategoryKey,
    input: row.input,
    result: row.result,
    logicVersion: row.logicVersion,
    recommendedPrice: row.recommendedPrice,
    quickPrice: row.quickPrice,
    marketPrice: row.marketPrice,
    premiumPrice: row.premiumPrice,
    rangeLow: row.rangeLow,
    rangeHigh: row.rangeHigh,
    score: row.score,
    confidence: row.confidence,
    factors: row.factors,
    todos: row.todos,
    listingTitle: row.listingTitle,
    listingDescription: row.listingDescription,
    copySource: row.copySource,
    soldPrice: row.soldPrice,
    daysToSell: row.daysToSell,
    discountCount: row.discountCount,
    soldReportedAt: row.soldReportedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
