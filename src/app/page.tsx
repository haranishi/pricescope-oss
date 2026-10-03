"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { APPRAISAL_DRAFT_KEY } from "@/components/appraisal-actions";
import {
  calculate,
  buildFactors,
  buildTodos,
  buildCopy,
  getScoreText,
  yen,
  categoryRules,
  multipliers,
  speedRules,
  trustScores,
  type ItemInput,
  type CategoryKey,
  type TrustKey,
} from "@/lib/estimator";

const opts = <T extends Record<string, { label: string }>>(o: T) =>
  Object.entries(o).map(([k, v]) => ({ value: k, label: v.label }));

const CATEGORY_OPTS = Object.entries(categoryRules).map(([k, v]) => ({ value: k, label: v.label }));

export default function Home() {
  const [d, setD] = useState<ItemInput>({
    name: "PORTER タンカー 2WAY ブリーフケース",
    category: "fashion",
    brandTier: "premium",
    originalPrice: 38500,
    ageYears: 3,
    condition: "good",
    accessories: "none",
    demand: "hot",
    rarity: "normal",
    speed: "normal",
    seasonality: "neutral",
    trust: ["cleaned", "photos", "defects"],
    notes: "角に軽い擦れあり。ファスナー動作問題なし。",
  });

  const set = <K extends keyof ItemInput>(k: K, v: ItemInput[K]) => setD((p) => ({ ...p, [k]: v }));
  const toggleTrust = (key: TrustKey) =>
    setD((p) => ({ ...p, trust: p.trust.includes(key) ? p.trust.filter((t) => t !== key) : [...p.trust, key] }));

  const result = useMemo(() => calculate(d), [d]);
  const factors = useMemo(() => buildFactors(d, result), [d, result]);
  const todos = useMemo(() => buildTodos(d, result), [d, result]);
  const copy = useMemo(() => buildCopy(d, result), [d, result]);
  const scoreText = getScoreText(result.score);

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedId, setSavedId] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(APPRAISAL_DRAFT_KEY);
    if (!stored) return;
    const timeout = window.setTimeout(() => {
      try {
        setD(JSON.parse(stored) as ItemInput);
      } catch {
        // 壊れたローカル下書きは破棄して既定入力を維持する。
      } finally {
        localStorage.removeItem(APPRAISAL_DRAFT_KEY);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveError("");
    setSavedId("");
    try {
      const response = await fetch("/api/appraisals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: d }),
      });
      const body = (await response.json()) as { data?: { id: string }; error?: string; details?: { message: string }[] };
      if (response.status === 401) {
        localStorage.setItem(APPRAISAL_DRAFT_KEY, JSON.stringify(d));
        setShowLogin(true);
        return;
      }
      if (!response.ok) {
        setSaveError(body.details?.[0]?.message ?? body.error ?? "査定を保存できませんでした");
        return;
      }
      setSavedId(body.data?.id ?? "");
    } catch {
      localStorage.setItem(APPRAISAL_DRAFT_KEY, JSON.stringify(d));
      setSaveError("通信に失敗しました。入力を端末に退避しました。再試行してください。");
    } finally {
      setSaving(false);
    }
  };

  const doCopy = async () => {
    const text = [
      `商品: ${d.name}`,
      `推奨出品価格: ${yen(result.recommended)}`,
      `早売り: ${yen(result.quick)} / 相場中心: ${yen(result.market)} / 強気: ${yen(result.premium)}`,
      `想定レンジ: ${yen(result.low)}〜${yen(result.high)}`,
      `売れやすさスコア: ${result.score}`,
      "",
      copy.title,
      "",
      copy.description,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const accent = "#159a6b";

  return (
    <main className="flex-1 bg-zinc-50 text-zinc-900 px-5 py-8 md:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">フリマ出品価格をすぐ査定</h1>
          <p className="text-sm text-zinc-500 mt-1">フリマ出品前に、売れやすい価格帯と改善点・出品文の目安を出します。※価格は推定の目安（実売と異なります）。</p>
        </header>

        <div className="grid md:grid-cols-[320px_1fr] gap-6">
          {/* 入力 */}
          <section className="rounded-xl bg-white border border-zinc-200 p-4 space-y-3 h-fit">
            <L label="商品名"><input className="inp" value={d.name} onChange={(e) => set("name", e.target.value)} /></L>
            <L label="カテゴリ"><Sel value={d.category} onChange={(v) => set("category", v as CategoryKey)} options={CATEGORY_OPTS} /></L>
            <div className="grid grid-cols-2 gap-2">
              <L label="購入価格(円)"><input type="number" className="inp" value={d.originalPrice} onChange={(e) => set("originalPrice", +e.target.value)} /></L>
              <L label="経過年数"><input type="number" className="inp" value={d.ageYears} onChange={(e) => set("ageYears", +e.target.value)} /></L>
            </div>
            <L label="ブランド力"><Sel value={d.brandTier} onChange={(v) => set("brandTier", v as ItemInput["brandTier"])} options={opts(multipliers.brandTier)} /></L>
            <L label="状態"><Sel value={d.condition} onChange={(v) => set("condition", v as ItemInput["condition"])} options={opts(multipliers.condition)} /></L>
            <L label="付属品"><Sel value={d.accessories} onChange={(v) => set("accessories", v as ItemInput["accessories"])} options={opts(multipliers.accessories)} /></L>
            <div className="grid grid-cols-2 gap-2">
              <L label="需要"><Sel value={d.demand} onChange={(v) => set("demand", v as ItemInput["demand"])} options={opts(multipliers.demand)} /></L>
              <L label="希少性"><Sel value={d.rarity} onChange={(v) => set("rarity", v as ItemInput["rarity"])} options={opts(multipliers.rarity)} /></L>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <L label="売りたい速さ"><Sel value={d.speed} onChange={(v) => set("speed", v as ItemInput["speed"])} options={opts(speedRules)} /></L>
              <L label="季節性"><Sel value={d.seasonality} onChange={(v) => set("seasonality", v as ItemInput["seasonality"])} options={opts(multipliers.seasonality)} /></L>
            </div>
            <div>
              <span className="text-xs text-zinc-500">対応済み（信頼要素）</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(Object.keys(trustScores) as TrustKey[]).map((k) => (
                  <button type="button" key={k} onClick={() => toggleTrust(k)}
                    className={`rounded-full px-2.5 py-1 text-xs border ${d.trust.includes(k) ? "text-white border-transparent" : "bg-zinc-50 border-zinc-300 text-zinc-600"}`}
                    style={d.trust.includes(k) ? { background: accent } : {}}>
                    {trustScores[k].label}
                  </button>
                ))}
              </div>
            </div>
            <L label="補足メモ"><textarea className="inp" rows={2} value={d.notes} onChange={(e) => set("notes", e.target.value)} /></L>
          </section>

          {/* 結果 */}
          <section className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Price label="推奨" value={result.recommended} accent={accent} big />
              <Price label="早売り" value={result.quick} />
              <Price label="相場中心" value={result.market} />
              <Price label="強気" value={result.premium} />
            </div>

            <div className="rounded-xl bg-white border border-zinc-200 p-4 flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: accent }}>{result.score}</div>
                <div className="text-[11px] text-zinc-400">売れやすさ</div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{scoreText.title}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{scoreText.summary}</div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  想定レンジ {yen(result.low)}〜{yen(result.high)} ／ 購入価格比 {Math.round((result.market / Math.max(d.originalPrice, 1)) * 100)}% ／ 信頼度 {result.confidence}%
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <button type="button" onClick={save} disabled={saving || !d.name || d.originalPrice <= 0} className="min-h-11 w-full rounded-lg bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? "保存中…" : savedId ? "保存しました" : "この査定を保存"}
              </button>
              {savedId && <p role="status" className="mt-3 text-center text-sm text-emerald-700">査定を保存しました。<Link href={`/history/${savedId}`} className="ml-1 font-semibold underline underline-offset-2">詳細を見る</Link></p>}
              {saveError && <div className="mt-3 text-center"><p role="alert" className="text-sm text-rose-700">{saveError}</p><button type="button" onClick={save} className="mt-2 min-h-11 rounded-lg border border-zinc-300 px-4 text-sm font-medium">再試行</button></div>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white border border-zinc-200 p-4">
                <h3 className="text-sm font-semibold mb-2">価格に効く要素</h3>
                <div className="space-y-1.5">
                  {factors.map((f, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className={`w-4 text-center font-bold ${f.value === "positive" ? "text-emerald-600" : f.value === "negative" ? "text-rose-500" : "text-zinc-400"}`}>
                        {f.value === "positive" ? "+" : f.value === "negative" ? "−" : "="}
                      </span>
                      <div><strong>{f.label}</strong><span className="text-zinc-500"> — {f.reason}</span></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-white border border-zinc-200 p-4">
                <h3 className="text-sm font-semibold mb-2">改善チェック</h3>
                <div className="space-y-1.5">
                  {todos.map((t, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className={`w-4 text-center font-bold ${t.priority === "high" ? "text-rose-500" : t.priority === "medium" ? "text-amber-500" : "text-emerald-600"}`}>
                        {t.priority === "high" ? "!" : t.priority === "medium" ? "•" : "✓"}
                      </span>
                      <div><strong>{t.title}</strong><span className="text-zinc-500"> — {t.text}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-zinc-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">出品文（コピペ用）</h3>
                <button onClick={doCopy} className="text-xs rounded-md px-3 py-1 text-white" style={{ background: accent }}>{copied ? "コピー済み" : "コピー"}</button>
              </div>
              <input className="inp font-medium" readOnly value={copy.title} />
              <textarea className="inp mt-2 text-xs" rows={8} readOnly value={copy.description} />
              <p className="text-[11px] text-zinc-400 mt-2">⚙️ 設定待ち：AIによる出品文の高度化・画像からの状態判定は P2（Anthropic APIキーが必要）。P1はルールベースで動作。</p>
            </div>
          </section>
        </div>
      </div>

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-5" role="dialog" aria-modal="true" aria-labelledby="login-dialog-title">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 id="login-dialog-title" className="text-lg font-bold">保存にはログインが必要です</h2>
            <p className="mt-2 text-sm text-zinc-500">入力内容はこの端末に退避しました。ログイン後に自動で復元します。</p>
            <div className="mt-5 grid gap-3">
              <Link href="/login?callbackUrl=%2F%3Frestore%3D1" className="flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 font-semibold text-white">ログイン</Link>
              <Link href="/signup?callbackUrl=%2F%3Frestore%3D1" className="flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 px-4 font-medium text-zinc-700">無料で会員登録</Link>
              <button type="button" onClick={() => setShowLogin(false)} className="min-h-11 text-sm text-zinc-500">閉じる</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs text-zinc-500">{label}</span><div className="mt-1">{children}</div></label>;
}

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select className="inp" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Price({ label, value, accent, big }: { label: string; value: number; accent?: string; big?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${big ? "border-transparent text-white" : "bg-white border-zinc-200"}`} style={big ? { background: accent } : {}}>
      <div className={`text-[11px] ${big ? "text-white/80" : "text-zinc-400"}`}>{label}</div>
      <div className={`font-bold ${big ? "text-xl" : "text-lg"}`}>{yen(value)}</div>
    </div>
  );
}
