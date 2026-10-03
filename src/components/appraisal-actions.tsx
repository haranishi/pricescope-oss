"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ItemInput } from "@/lib/estimator";

export const APPRAISAL_DRAFT_KEY = "pricescope:appraisal-draft";

export function AppraisalActions({ id, input }: { id: string; input: ItemInput }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  function reappraise() {
    localStorage.setItem(APPRAISAL_DRAFT_KEY, JSON.stringify(input));
    router.push("/?restore=1");
  }

  async function remove() {
    if (!window.confirm("この査定を削除します。元に戻せません。よろしいですか？")) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/appraisals/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "削除できませんでした");
        return;
      }
      router.push("/history");
      router.refresh();
    } catch {
      setError("通信に失敗しました。再試行してください");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reappraise} className="min-h-11 flex-1 rounded-lg bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700">この内容で再査定</button>
        <button type="button" onClick={remove} disabled={deleting} className="min-h-11 rounded-lg border border-rose-300 px-5 font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60">{deleting ? "削除中…" : "削除"}</button>
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    </div>
  );
}
