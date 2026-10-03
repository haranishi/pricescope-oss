import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { AppraisalActions } from "@/components/appraisal-actions";
import { CopyButton } from "@/components/copy-button";
import { getAppraisal } from "@/lib/appraisals";
import { categoryRules, multipliers, speedRules, trustScores, yen } from "@/lib/estimator";

export default async function AppraisalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/history/${id}`)}`);
  if (!z.uuid().safeParse(id).success) notFound();
  const item = await getAppraisal(session.user.id, id);
  if (!item) notFound();
  const inputRows = [
    ["商品名", item.input.name],
    ["カテゴリ", categoryRules[item.input.category].label],
    ["購入価格", yen(item.input.originalPrice)],
    ["経過年数", `${item.input.ageYears}年`],
    ["ブランド力", multipliers.brandTier[item.input.brandTier].label],
    ["状態", multipliers.condition[item.input.condition].label],
    ["付属品", multipliers.accessories[item.input.accessories].label],
    ["需要", multipliers.demand[item.input.demand].label],
    ["希少性", multipliers.rarity[item.input.rarity].label],
    ["売りたい速さ", speedRules[item.input.speed].label],
    ["季節性", multipliers.seasonality[item.input.seasonality].label],
    ["信頼要素", item.input.trust.length ? item.input.trust.map((key) => trustScores[key].label).join("、") : "なし"],
    ["補足メモ", item.input.notes || "なし"],
  ];

  return (
    <main className="flex-1 bg-zinc-50 px-5 py-8 md:px-10">
      <article className="mx-auto max-w-4xl space-y-5">
        <div>
          <Link href="/history" className="text-sm font-medium text-emerald-700">← 履歴一覧</Link>
          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{item.itemName}</h1>
              <p className="mt-1 text-sm text-zinc-500">{categoryRules[item.category].label} ・ {new Intl.DateTimeFormat("ja-JP", { dateStyle: "long", timeZone: "Asia/Tokyo" }).format(new Date(item.createdAt))} 保存 ・ ロジック {item.logicVersion}</p>
            </div>
            <div className="w-fit rounded-lg bg-zinc-100 px-4 py-2 text-center"><strong className="text-xl text-emerald-700">{item.score}</strong><span className="ml-1 text-xs text-zinc-500">スコア</span></div>
          </div>
        </div>

        <section className="rounded-xl bg-emerald-600 p-5 text-white">
          <p className="text-sm text-white/80">保存時の推奨価格</p>
          <p className="mt-1 text-3xl font-bold">{yen(item.recommendedPrice)}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm"><div>早売り<br /><strong>{yen(item.quickPrice)}</strong></div><div>相場中心<br /><strong>{yen(item.marketPrice)}</strong></div><div>強気<br /><strong>{yen(item.premiumPrice)}</strong></div></div>
          <p className="mt-4 text-xs text-white/80">レンジ {yen(item.rangeLow)}〜{yen(item.rangeHigh)} ・ 信頼度 {item.confidence}%</p>
        </section>

        <details className="rounded-xl border border-zinc-200 bg-white p-4" open>
          <summary className="cursor-pointer font-semibold">入力内容（保存時スナップショット）</summary>
          <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">{inputRows.map(([label, value]) => <div key={label}><dt className="text-xs text-zinc-500">{label}</dt><dd className="mt-0.5 break-words text-zinc-800">{value}</dd></div>)}</dl>
        </details>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-4"><h2 className="font-semibold">価格に効く要素</h2><div className="mt-3 space-y-2 text-sm">{item.factors.map((factor, index) => <div key={index}><strong>{factor.value === "positive" ? "+" : factor.value === "negative" ? "−" : "="} {factor.label}</strong><p className="text-xs text-zinc-500">{factor.reason}</p></div>)}</div></section>
          <section className="rounded-xl border border-zinc-200 bg-white p-4"><h2 className="font-semibold">改善チェック</h2><div className="mt-3 space-y-2 text-sm">{item.todos.map((todo, index) => <div key={index}><strong>{todo.priority === "high" ? "!" : todo.priority === "medium" ? "•" : "✓"} {todo.title}</strong><p className="text-xs text-zinc-500">{todo.text}</p></div>)}</div></section>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="font-semibold">出品文（保存時スナップショット）</h2>
          <div className="mt-3 flex items-start gap-2"><h3 className="min-w-0 flex-1 rounded-lg bg-zinc-50 p-3 text-sm font-medium">{item.listingTitle}</h3><CopyButton value={item.listingTitle ?? ""} label="タイトル" /></div>
          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">{item.listingDescription}</p>
          <div className="mt-2 text-right"><CopyButton value={item.listingDescription ?? ""} label="説明文" /></div>
        </section>
        <AppraisalActions id={item.id} input={item.input} />
      </article>
    </main>
  );
}
