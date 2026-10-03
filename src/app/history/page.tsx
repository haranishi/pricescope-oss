import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { categoryRules, yen, type CategoryKey } from "@/lib/estimator";
import { listAppraisals } from "@/lib/appraisals";
import { appraisalListQuerySchema } from "@/lib/validation";

type SearchParams = Promise<{ page?: string | string[]; q?: string | string[]; category?: string | string[] }>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function historyUrl(page: number, q: string, category?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `/history?${query}` : "/history";
}

export default async function HistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=%2Fhistory");
  const raw = await searchParams;
  const filters = appraisalListQuerySchema.parse({
    page: first(raw.page) ?? "1",
    q: first(raw.q) ?? "",
    category: first(raw.category),
  });
  const data = await listAppraisals(session.user.id, filters);
  const hasFilters = Boolean(filters.q || filters.category);

  return (
    <main className="flex-1 bg-zinc-50 px-5 py-8 md:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">査定履歴</h1>
            <p className="mt-1 text-sm text-zinc-500">保存した査定を新しい順に表示します。</p>
          </div>
          <Link href="/" className="flex min-h-11 items-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700">新しく査定</Link>
        </div>

        <form method="get" className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-[1fr_220px_auto]">
          <div>
            <label htmlFor="q" className="text-xs text-zinc-500">商品名で検索</label>
            <input id="q" name="q" defaultValue={filters.q} placeholder="商品名を入力" className="inp mt-1" />
          </div>
          <div>
            <label htmlFor="category" className="text-xs text-zinc-500">カテゴリ</label>
            <select id="category" name="category" defaultValue={filters.category ?? ""} className="inp mt-1">
              <option value="">すべて</option>
              {(Object.entries(categoryRules) as [CategoryKey, { label: string }][]).map(([key, rule]) => <option key={key} value={key}>{rule.label}</option>)}
            </select>
          </div>
          <button className="min-h-11 self-end rounded-lg bg-zinc-800 px-5 text-sm font-semibold text-white hover:bg-zinc-900">検索</button>
        </form>

        {data.items.length ? (
          <>
            <div className="mt-5 space-y-3">
              {data.items.map((item) => (
                <Link key={item.id} href={`/history/${item.id}`} className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-zinc-900">{item.itemName}</h2>
                      <p className="mt-1 text-sm text-zinc-500">{categoryRules[item.category].label} ・ 推奨 {yen(item.recommendedPrice)} ・ {new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeZone: "Asia/Tokyo" }).format(new Date(item.createdAt))}</p>
                      {item.soldPrice !== null && <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">実売報告済み</span>}
                    </div>
                    <div className="shrink-0 rounded-lg bg-zinc-100 px-3 py-2 text-center">
                      <strong className="text-lg text-emerald-700">{item.score}</strong>
                      <span className="block text-[10px] text-zinc-500">スコア</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <nav aria-label="履歴のページ送り" className="mt-6 flex items-center justify-center gap-4">
              {data.page > 1 ? <Link href={historyUrl(data.page - 1, filters.q, filters.category)} className="flex min-h-11 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm">前へ</Link> : <span />}
              <span className="text-sm text-zinc-500">{data.page} / {Math.max(1, Math.ceil(data.total / data.pageSize))} ページ</span>
              {data.hasNext ? <Link href={historyUrl(data.page + 1, filters.q, filters.category)} className="flex min-h-11 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm">次へ</Link> : <span />}
            </nav>
          </>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
            <h2 className="font-semibold text-zinc-800">{hasFilters ? "条件に一致する査定はありません" : "まだ保存された査定はありません"}</h2>
            <p className="mt-2 text-sm text-zinc-500">{hasFilters ? "検索条件を変えてお試しください。" : "最初の査定を保存して、価格の記録を残しましょう。"}</p>
            <Link href={hasFilters ? "/history" : "/"} className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white">{hasFilters ? "条件をクリア" : "査定を始める"}</Link>
          </div>
        )}
      </div>
    </main>
  );
}
