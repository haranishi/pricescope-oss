import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { appraisals } from "@/db/schema";
import { getAppraisal } from "@/lib/appraisals";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };
const noStoreHeaders = { "Cache-Control": "private, no-store" };

export async function GET(_request: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401, headers: noStoreHeaders });
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return Response.json({ error: "査定が見つかりません" }, { status: 404, headers: noStoreHeaders });
  }

  try {
    const appraisal = await getAppraisal(session.user.id, id);
    if (!appraisal) {
      return Response.json({ error: "査定が見つかりません" }, { status: 404, headers: noStoreHeaders });
    }
    return Response.json({ data: {
      id: appraisal.id,
      item_name: appraisal.itemName,
      category: appraisal.category,
      input: appraisal.input,
      result: appraisal.result,
      logic_version: appraisal.logicVersion,
      recommended_price: appraisal.recommendedPrice,
      quick_price: appraisal.quickPrice,
      market_price: appraisal.marketPrice,
      premium_price: appraisal.premiumPrice,
      range_low: appraisal.rangeLow,
      range_high: appraisal.rangeHigh,
      score: appraisal.score,
      confidence: appraisal.confidence,
      factors: appraisal.factors,
      todos: appraisal.todos,
      listing_title: appraisal.listingTitle,
      listing_description: appraisal.listingDescription,
      copy_source: appraisal.copySource,
      sold_price: appraisal.soldPrice,
      days_to_sell: appraisal.daysToSell,
      discount_count: appraisal.discountCount,
      sold_reported_at: appraisal.soldReportedAt,
      created_at: appraisal.createdAt,
    } }, { headers: noStoreHeaders });
  } catch {
    return Response.json({ error: "査定を取得できませんでした" }, { status: 500, headers: noStoreHeaders });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401, headers: noStoreHeaders });
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return Response.json({ error: "査定が見つかりません" }, { status: 404, headers: noStoreHeaders });
  }

  try {
    const deleted = await db
      .delete(appraisals)
      .where(and(eq(appraisals.id, id), eq(appraisals.userId, session.user.id)))
      .returning({ id: appraisals.id });
    if (!deleted.length) {
      return Response.json({ error: "査定が見つかりません" }, { status: 404, headers: noStoreHeaders });
    }
    return new Response(null, { status: 204, headers: noStoreHeaders });
  } catch {
    return Response.json({ error: "査定を削除できませんでした" }, { status: 500, headers: noStoreHeaders });
  }
}
