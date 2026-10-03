import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, users } from "@/db/schema";
import { credentialsSchema, validationError } from "@/lib/validation";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasUniqueViolationCode(value: unknown) {
  return isRecord(value) && value.code === "23505";
}

function isUniqueViolation(error: unknown) {
  if (hasUniqueViolationCode(error)) return true;
  if (!isRecord(error)) return false;

  const cause = error.cause;
  if (hasUniqueViolationCode(cause)) return true;
  if (!isRecord(cause)) return false;

  return hasUniqueViolationCode(cause.sourceError);
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  const parsed = credentialsSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "入力内容を確認してください", details: validationError(parsed.error.issues) },
      { status: 400 },
    );
  }

  const passwordHash = await hash(parsed.data.password, 12);
  let userId: string | undefined;

  try {
    const [user] = await db
      .insert(users)
      .values({ email: parsed.data.email, passwordHash })
      .returning({ id: users.id });
    userId = user.id;

    try {
      await db.insert(profiles).values({ id: user.id, plan: "free" });
    } catch (profileError) {
      await db.delete(users).where(eq(users.id, user.id));
      throw profileError;
    }

    return Response.json({ data: { id: user.id, email: parsed.data.email } }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return Response.json({ error: "このメールアドレスはすでに登録されています" }, { status: 409 });
    }

    if (userId) {
      try {
        await db.delete(users).where(eq(users.id, userId));
      } catch {
        // 最初の補償削除が失敗した場合だけ再試行する。PIIはログに出さない。
      }
    }
    return Response.json({ error: "アカウントを作成できませんでした。時間をおいて再試行してください" }, { status: 500 });
  }
}
