export default function HistoryLoading() {
  return (
    <main className="flex-1 bg-zinc-50 px-5 py-8 md:px-10" aria-busy="true" aria-label="査定履歴を読み込み中">
      <div className="mx-auto max-w-4xl animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-zinc-200" />
        <div className="h-24 rounded-xl bg-zinc-200" />
        {[0, 1, 2].map((item) => <div key={item} className="h-24 rounded-xl bg-zinc-200" />)}
      </div>
    </main>
  );
}
