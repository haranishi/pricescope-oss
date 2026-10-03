"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthForm({ mode, callbackUrl }: { mode: "login" | "signup"; callbackUrl: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(body.error ?? "アカウントを作成できませんでした");
          return;
        }
      }

      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
      if (result?.error) {
        setError("メールアドレスまたはパスワードが違います");
        return;
      }
      router.push(result?.url ?? callbackUrl);
      router.refresh();
    } catch {
      setError("通信に失敗しました。時間をおいて再試行してください");
    } finally {
      setPending(false);
    }
  }

  const alternateUrl = `${mode === "login" ? "/signup" : "/login"}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">メールアドレス</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="inp mt-1" />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">パスワード</label>
        <input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} maxLength={72} required aria-describedby={error ? "auth-error" : undefined} className="inp mt-1" />
        {mode === "signup" && <p className="mt-1 text-xs text-zinc-500">8文字以上で入力してください。</p>}
      </div>
      {error && <p id="auth-error" role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button disabled={pending} className="min-h-11 w-full rounded-lg bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
        {pending ? "処理中…" : mode === "login" ? "ログイン" : "無料で登録"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        {mode === "login" ? "アカウントをお持ちでない方は" : "すでにアカウントをお持ちの方は"}{" "}
        <Link href={alternateUrl} className="font-medium text-emerald-700 underline underline-offset-2">{mode === "login" ? "会員登録" : "ログイン"}</Link>
      </p>
    </form>
  );
}
