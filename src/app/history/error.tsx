"use client";

export default function HistoryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex-1 bg-zinc-50 px-5 py-16 text-center">
      <h1 className="text-xl font-bold text-zinc-900">査定履歴を読み込めませんでした</h1>
      <p className="mt-2 text-sm text-zinc-500">通信状態を確認して、もう一度お試しください。</p>
      <button type="button" onClick={reset} className="mt-5 min-h-11 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white">再試行</button>
    </main>
  );
}
