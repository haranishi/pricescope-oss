"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export function SiteHeader({ email }: { email?: string | null }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-10">
        <Link href="/" className="text-xl font-bold text-emerald-600">
          PriceScope <span className="hidden text-sm font-normal text-zinc-400 sm:inline">出品価格チェッカー</span>
        </Link>
        <nav aria-label="メインナビゲーション" className="flex items-center gap-3 text-sm">
          {email ? (
            <>
              <span className="hidden max-w-52 truncate text-zinc-500 md:inline" title={email}>{email}</span>
              <Link href="/history" className="rounded-lg px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100">履歴</Link>
              <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="min-h-11 rounded-lg border border-zinc-300 px-3 font-medium text-zinc-700 hover:bg-zinc-50">
                ログアウト
              </button>
            </>
          ) : (
            <Link href="/login" className="flex min-h-11 items-center rounded-lg border border-zinc-300 px-4 font-medium text-zinc-700 hover:bg-zinc-50">ログイン</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
