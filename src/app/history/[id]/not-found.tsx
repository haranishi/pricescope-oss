import Link from "next/link";

export default function NotFound() {
  return <main className="flex-1 bg-zinc-50 px-5 py-16 text-center"><h1 className="text-xl font-bold">査定が見つかりません</h1><p className="mt-2 text-sm text-zinc-500">削除済みか、表示する権限がありません。</p><Link href="/history" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white">履歴一覧へ</Link></main>;
}
