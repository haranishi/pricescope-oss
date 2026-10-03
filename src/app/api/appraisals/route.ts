import { auth } from "@/auth";
import { db } from "@/db";
import { appraisals } from "@/db/schema";
import {
  LOGIC_VERSION,
  buildCopy,
  buildFactors,
  buildTodos,
  calculate,
} from "@/lib/estimator";
import { listAppraisals } from "@/lib/appraisals";
import {
  appraisalListQuerySchema,
  appraisalRequestSchema,
  validationError,
} from "@/lib/validation";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  const parsed = appraisalRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "入力内容を確認してください", details: validationError(parsed.error.issues) },
      { status: 400 },
    );
  }

  const input = parsed.data.input;
  const result = calculate(input);
  const factors = buildFactors(input, result);
  const todos = buildTodos(input, result);
  const copy = buildCopy(input, result);
  const resultSnapshot = {
    recommended: result.recommended,
    quick: result.quick,
    market: result.market,
    premium: result.premium,
    low: result.low,
    high: result.high,
    score: result.score,
    confidence: result.confidence,
  };

  try {
    const [saved] = await db
      .insert(appraisals)
      .values({
        userId: session.user.id,
        itemName: input.name,
        category: input.category,
        input,
        result: resultSnapshot,
        logicVersion: LOGIC_VERSION,
        recommendedPrice: result.recommended,
        quickPrice: result.quick,
        marketPrice: result.market,
        premiumPrice: result.premium,
        rangeLow: result.low,
        rangeHigh: result.high,
        score: result.score,
        confidence: result.confidence,
        factors,
        todos,
        listingTitle: copy.title,
        listingDescription: copy.description,
        copySource: "rule",
      })
      .returning({
        id: appraisals.id,
        logicVersion: appraisals.logicVersion,
        recommendedPrice: appraisals.recommendedPrice,
        quickPrice: appraisals.quickPrice,
        marketPrice: appraisals.marketPrice,
        premiumPrice: appraisals.premiumPrice,
        rangeLow: appraisals.rangeLow,
        rangeHigh: appraisals.rangeHigh,
        score: appraisals.score,
        confidence: appraisals.confidence,
        listingTitle: appraisals.listingTitle,
        listingDescription: appraisals.listingDescription,
        createdAt: appraisals.createdAt,
      });

    return Response.json(
      { data: {
        id: saved.id,
        logic_version: saved.logicVersion,
        recommended_price: saved.recommendedPrice,
        quick_price: saved.quickPrice,
        market_price: saved.marketPrice,
        premium_price: saved.premiumPrice,
        range_low: saved.rangeLow,
        range_high: saved.rangeHigh,
        score: saved.score,
        confidence: saved.confidence,
        listing_title: saved.listingTitle,
        listing_description: saved.listingDescription,
        created_at: saved.createdAt.toISOString(),
      } },
      { status: 201, headers: noStoreHeaders },
    );
  } catch {
    return Response.json(
      { error: "査定を保存できませんでした。時間をおいて再試行してください" },
      { status: 500, headers: noStoreHeaders },
    );
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "ログインが必要です" }, { status: 401, headers: noStoreHeaders });
  }

  const url = new URL(request.url);
  const parsed = appraisalListQuerySchema.parse({
    page: url.searchParams.get("page") ?? "1",
    q: url.searchParams.get("q") ?? "",
    category: url.searchParams.get("category") || undefined,
  });

  try {
    const data = await listAppraisals(session.user.id, parsed);
    return Response.json({ data: {
      items: data.items.map((item) => ({
        id: item.id,
        item_name: item.itemName,
        category: item.category,
        recommended_price: item.recommendedPrice,
        score: item.score,
        sold_price: item.soldPrice,
        created_at: item.createdAt,
      })),
      page: data.page,
      page_size: data.pageSize,
      total: data.total,
      has_next: data.hasNext,
    } }, { headers: noStoreHeaders });
  } catch {
    return Response.json(
      { error: "査定履歴を取得できませんでした" },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
