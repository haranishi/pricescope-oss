import { z } from "zod";

export const categoryValues = [
  "electronics",
  "fashion",
  "luxury",
  "hobby",
  "furniture",
  "sports",
  "baby",
  "books",
] as const;

const trustValues = ["cleaned", "tested", "photos", "receipt", "defects"] as const;

export const itemInputSchema = z
  .object({
    name: z.string().trim().min(1, "商品名を入力してください").max(120, "商品名は120文字以内で入力してください"),
    category: z.enum(categoryValues, { error: "カテゴリが正しくありません" }),
    brandTier: z.enum(["premium", "standard", "niche"], { error: "ブランド力が正しくありません" }),
    originalPrice: z.number().int("購入価格は整数で入力してください").min(1, "購入価格は1円以上で入力してください").max(99_999_999, "購入価格が上限を超えています"),
    ageYears: z.number().min(0, "経過年数は0以上で入力してください").max(50, "経過年数は50年以内で入力してください").multipleOf(0.5, "経過年数は0.5年単位で入力してください"),
    condition: z.enum(["new", "likeNew", "good", "fair", "poor"], { error: "状態が正しくありません" }),
    accessories: z.enum(["complete", "partial", "none"], { error: "付属品が正しくありません" }),
    demand: z.enum(["hot", "normal", "low"], { error: "需要が正しくありません" }),
    rarity: z.enum(["limited", "normal", "common"], { error: "希少性が正しくありません" }),
    speed: z.enum(["fast", "normal", "patient"], { error: "売りたい速さが正しくありません" }),
    seasonality: z.enum(["peak", "neutral", "off"], { error: "季節性が正しくありません" }),
    trust: z.array(z.enum(trustValues)).max(trustValues.length).refine((values) => new Set(values).size === values.length, "信頼要素が重複しています"),
    notes: z.string().max(2000, "補足メモは2000文字以内で入力してください"),
  })
  .strict();

export const appraisalRequestSchema = z.object({ input: itemInputSchema }).strict();

export const authorizeCredentialsSchema = z.object({
  email: z.email({ error: "メールアドレスの形式が正しくありません" }).trim().toLowerCase(),
  password: z.string().min(8, "パスワードは8文字以上で入力してください").max(72, "パスワードは72文字以内で入力してください"),
});

export const credentialsSchema = authorizeCredentialsSchema.strict();

export const appraisalListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  q: z.string().trim().max(120).catch(""),
  category: z.enum(categoryValues).optional().catch(undefined),
});

export function validationError(issues: z.core.$ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}
