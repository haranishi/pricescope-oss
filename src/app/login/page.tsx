import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthForm } from "@/components/auth-form";

function safeCallbackUrl(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.startsWith("/") && !candidate.startsWith("//") ? candidate : "/";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl);
  const session = await auth();
  if (session?.user?.id) redirect(callbackUrl);
  return (
    <main className="flex-1 bg-zinc-50 px-5 py-12">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-zinc-900">ログイン</h1>
        <p className="mb-6 mt-2 text-sm text-zinc-500">保存した査定をいつでも見返せます。</p>
        <AuthForm mode="login" callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
