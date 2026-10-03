"use client";

import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return <button type="button" onClick={copy} className="min-h-11 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-700">{copied ? "コピー済み" : `${label}をコピー`}</button>;
}
