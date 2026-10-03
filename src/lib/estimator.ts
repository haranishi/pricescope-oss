/**
 * PriceScope 査定ロジック（試作 listing-value-estimator/app.js の忠実移植）
 * ------------------------------------------------------------------
 * 要件定義書の方針：プロト版と「同一入力→同一出力」を保つ（係数・式・文言を変えない）。
 * 係数を変えるときは logic_version を上げる。P1は外部API非依存（クライアント完結）。
 */
export const LOGIC_VERSION = "v1";

export type CategoryKey =
  | "electronics" | "fashion" | "luxury" | "hobby" | "furniture" | "sports" | "baby" | "books";

type CategoryRule = { label: string; base: number; yearlyDrop: number; floor: number; ceiling: number; keywords: string[] };

export const categoryRules: Record<CategoryKey, CategoryRule> = {
  electronics: { label: "家電・ガジェット", base: 0.58, yearlyDrop: 0.13, floor: 0.12, ceiling: 0.92, keywords: ["動作確認済み", "初期化済み", "付属品"] },
  fashion: { label: "ファッション", base: 0.38, yearlyDrop: 0.08, floor: 0.08, ceiling: 0.82, keywords: ["サイズ", "着用回数", "採寸"] },
  luxury: { label: "ブランド品", base: 0.64, yearlyDrop: 0.035, floor: 0.22, ceiling: 1.12, keywords: ["正規品", "シリアル", "付属品"] },
  hobby: { label: "ホビー・コレクション", base: 0.5, yearlyDrop: 0.03, floor: 0.15, ceiling: 1.35, keywords: ["限定", "保管状態", "欠品なし"] },
  furniture: { label: "家具・インテリア", base: 0.34, yearlyDrop: 0.09, floor: 0.08, ceiling: 0.72, keywords: ["寸法", "配送方法", "使用年数"] },
  sports: { label: "スポーツ用品", base: 0.42, yearlyDrop: 0.09, floor: 0.1, ceiling: 0.86, keywords: ["使用頻度", "メンテナンス", "付属品"] },
  baby: { label: "ベビー用品", base: 0.36, yearlyDrop: 0.1, floor: 0.08, ceiling: 0.75, keywords: ["清掃済み", "安全確認", "使用期間"] },
  books: { label: "本・メディア", base: 0.32, yearlyDrop: 0.045, floor: 0.06, ceiling: 1.05, keywords: ["帯あり", "書き込みなし", "セット"] },
};

type Mult = { value: number; label: string; reason: string };

export const multipliers = {
  brandTier: {
    premium: { value: 1.18, label: "人気ブランド", reason: "検索されやすく、相場が崩れにくいです。" },
    standard: { value: 1, label: "一般ブランド", reason: "ブランドより状態と価格の妥当性が重要です。" },
    niche: { value: 0.86, label: "ニッチ・無名", reason: "比較対象が少なく、説明文の説得力が必要です。" },
  },
  condition: {
    new: { value: 1.28, label: "新品・未使用", reason: "未使用品は購入価格に近い価格を狙えます。" },
    likeNew: { value: 1.12, label: "未使用に近い", reason: "写真で状態が伝わると上振れしやすいです。" },
    good: { value: 1, label: "目立った傷なし", reason: "標準的な中古相場で見られます。" },
    fair: { value: 0.78, label: "やや傷や汚れあり", reason: "傷の見せ方で値下げ幅を抑えられます。" },
    poor: { value: 0.55, label: "傷や汚れあり", reason: "修理・部品取り需要も意識した価格が必要です。" },
  },
  accessories: {
    complete: { value: 1.11, label: "付属品完備", reason: "箱や説明書があると信頼度が上がります。" },
    partial: { value: 1, label: "一部あり", reason: "最低限の付属品は価格維持に効きます。" },
    none: { value: 0.9, label: "本体のみ", reason: "購入者の不安が残りやすいです。" },
  },
  demand: {
    hot: { value: 1.18, label: "需要が高い", reason: "強気価格でも反応を取りやすいです。" },
    normal: { value: 1, label: "需要は普通", reason: "相場中心の価格が最も売れやすいです。" },
    low: { value: 0.84, label: "需要が低い", reason: "閲覧数が伸びにくいため価格調整が必要です。" },
  },
  rarity: {
    limited: { value: 1.16, label: "希少性あり", reason: "欲しい人が明確なら上振れが狙えます。" },
    normal: { value: 1, label: "通常品", reason: "状態と価格で比較されます。" },
    common: { value: 0.9, label: "流通量が多い", reason: "競合が多く、少し安い価格が有利です。" },
  },
  seasonality: {
    peak: { value: 1.09, label: "今が売れ時", reason: "検索需要が高い時期です。" },
    neutral: { value: 1, label: "季節性は普通", reason: "価格への影響は限定的です。" },
    off: { value: 0.9, label: "時期外れ", reason: "売り切るには値付けを下げる判断も必要です。" },
  },
} as const;

export const speedRules = {
  fast: { label: "早く売りたい", recommended: 0.93, quick: 0.84, premium: 1.04 },
  normal: { label: "通常", recommended: 1, quick: 0.88, premium: 1.12 },
  patient: { label: "高めでも待てる", recommended: 1.08, quick: 0.92, premium: 1.2 },
} as const;

export const trustScores = {
  cleaned: { label: "清掃済み", score: 4, price: 1.015 },
  tested: { label: "動作確認済み", score: 6, price: 1.025 },
  photos: { label: "写真10枚以上", score: 5, price: 1.02 },
  receipt: { label: "購入証明あり", score: 5, price: 1.02 },
  defects: { label: "傷の写真あり", score: 5, price: 1.018 },
} as const;

export type TrustKey = keyof typeof trustScores;

export type ItemInput = {
  name: string;
  category: CategoryKey;
  brandTier: keyof typeof multipliers.brandTier;
  originalPrice: number;
  ageYears: number;
  condition: keyof typeof multipliers.condition;
  accessories: keyof typeof multipliers.accessories;
  demand: keyof typeof multipliers.demand;
  rarity: keyof typeof multipliers.rarity;
  speed: keyof typeof speedRules;
  seasonality: keyof typeof multipliers.seasonality;
  trust: TrustKey[];
  notes: string;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundPrice(value: number): number {
  if (value < 3000) return Math.max(300, Math.round(value / 100) * 100);
  if (value < 30000) return Math.round(value / 500) * 500;
  return Math.round(value / 1000) * 1000;
}

export type EstimateResult = {
  rule: CategoryRule;
  selectedMultipliers: Mult[];
  baseRate: number;
  market: number;
  quick: number;
  recommended: number;
  premium: number;
  low: number;
  high: number;
  score: number;
  confidence: number;
};

/** 査定計算（app.js calculate() の忠実移植） */
export function calculate(data: ItemInput): EstimateResult {
  const rule = categoryRules[data.category];
  const ageImpact = Math.max(0, 1 - data.ageYears * rule.yearlyDrop);
  const baseRate = clamp(rule.base * ageImpact, rule.floor, rule.ceiling);

  const selectedMultipliers: Mult[] = [
    multipliers.brandTier[data.brandTier],
    multipliers.condition[data.condition],
    multipliers.accessories[data.accessories],
    multipliers.demand[data.demand],
    multipliers.rarity[data.rarity],
    multipliers.seasonality[data.seasonality],
  ];

  const trustMultiplier = data.trust.reduce((total, key) => total * (trustScores[key]?.price ?? 1), 1);
  const multiplier = selectedMultipliers.reduce((total, item) => total * item.value, trustMultiplier);
  const market = roundPrice(data.originalPrice * baseRate * multiplier);
  const speed = speedRules[data.speed];
  const quick = roundPrice(market * speed.quick);
  const recommended = roundPrice(market * speed.recommended);
  const premium = roundPrice(market * speed.premium);
  const low = roundPrice(market * 0.82);
  const high = roundPrice(market * 1.18);

  const trustScore = data.trust.reduce((total, key) => total + (trustScores[key]?.score ?? 0), 0);
  const score = clamp(
    Math.round(
      46 +
        (multipliers.condition[data.condition].value - 1) * 42 +
        (multipliers.demand[data.demand].value - 1) * 38 +
        (multipliers.brandTier[data.brandTier].value - 1) * 26 +
        (multipliers.accessories[data.accessories].value - 1) * 24 +
        (multipliers.rarity[data.rarity].value - 1) * 28 +
        (multipliers.seasonality[data.seasonality].value - 1) * 24 +
        trustScore -
        data.ageYears * 1.2
    ),
    18,
    96
  );

  const confidence = clamp(
    Math.round(
      58 +
        data.trust.length * 5 +
        (data.originalPrice > 0 ? 8 : 0) +
        (data.notes ? 5 : 0) -
        (data.brandTier === "niche" ? 8 : 0)
    ),
    35,
    94
  );

  return { rule, selectedMultipliers, baseRate, market, quick, recommended, premium, low, high, score, confidence };
}

export function getScoreText(score: number): { title: string; summary: string } {
  if (score >= 82) return { title: "高く売れる可能性が高い", summary: "状態・需要・信頼要素が揃っています。最初は強気価格で反応を見てもよい水準です。" };
  if (score >= 64) return { title: "相場中心なら売れやすい", summary: "大きな弱点はありません。写真と説明文を整えると値下げ幅を抑えられます。" };
  if (score >= 46) return { title: "価格調整が必要", summary: "競合比較で負けやすい要素があります。早売り価格から始めるか、信頼要素を追加してください。" };
  return { title: "売り方の工夫が必要", summary: "状態・需要・経過年数の影響が大きいです。セット販売、部品取り、値下げ前提の設計が向いています。" };
}

export type Factor = { label: string; reason: string; value: "positive" | "neutral" | "negative" };

export function buildFactors(data: ItemInput, result: EstimateResult): Factor[] {
  const ageFactor: Factor = {
    label: "経過年数",
    reason: data.ageYears <= 1 ? "新しさが価格維持に効いています。" : `${data.ageYears}年経過のため、カテゴリ特性に応じて減価しています。`,
    value: data.ageYears <= 1 ? "positive" : data.ageYears <= 3 ? "neutral" : "negative",
  };
  return [
    { label: result.rule.label, reason: `カテゴリ基準の残価率は約${Math.round(result.baseRate * 100)}%です。`, value: "neutral" },
    ...result.selectedMultipliers.map((item): Factor => ({
      label: item.label,
      reason: item.reason,
      value: item.value > 1.05 ? "positive" : item.value < 0.95 ? "negative" : "neutral",
    })),
    ageFactor,
  ];
}

export type Todo = { priority: "high" | "medium" | "low"; title: string; text: string };

export function buildTodos(data: ItemInput, result: EstimateResult): Todo[] {
  const todos: Todo[] = [];
  if (!data.trust.includes("photos")) todos.push({ priority: "high", title: "写真を10枚以上にする", text: "正面、背面、角、傷、付属品、型番を載せると値下げ交渉を減らせます。" });
  if (!data.trust.includes("defects") && ["fair", "poor"].includes(data.condition)) todos.push({ priority: "high", title: "傷や汚れを先に見せる", text: "隠すよりも、傷の位置と使用に問題がない点を明記した方が成約しやすいです。" });
  if (!data.trust.includes("tested") && data.category === "electronics") todos.push({ priority: "high", title: "動作確認を追加する", text: "電源、充電、主要機能の確認結果を入れると信頼度が上がります。" });
  if (data.accessories !== "complete") todos.push({ priority: "medium", title: "付属品の有無を具体化する", text: "箱、説明書、ケーブル、保証書など、あるものとないものを分けて書いてください。" });
  if (data.brandTier === "niche") todos.push({ priority: "medium", title: "検索キーワードを増やす", text: "型番、用途、対応機種、素材、サイズなどで見つけてもらう設計が必要です。" });
  if (data.speed === "patient" && result.score < 60) todos.push({ priority: "medium", title: "強気価格で待ちすぎない", text: "閲覧数が低い場合は48〜72時間で価格を見直すのが現実的です。" });
  if (!todos.length) todos.push({ priority: "low", title: "初日は推奨価格で反応を見る", text: "閲覧数といいね数が弱ければ、翌日以降に早売り価格へ近づけてください。" });
  return todos;
}

const yenFmt = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
export function yen(v: number): string {
  return yenFmt.format(v);
}

export function buildCopy(data: ItemInput, result: EstimateResult): { title: string; description: string } {
  const condition = multipliers.condition[data.condition].label;
  const accessory = multipliers.accessories[data.accessories].label;
  const category = categoryRules[data.category].label;
  const keywords = categoryRules[data.category].keywords.join(" / ");
  const title = [
    data.name || "商品名未入力",
    condition,
    data.accessories === "complete" ? "付属品完備" : "",
    data.rarity === "limited" ? "希少" : "",
  ].filter(Boolean).join(" ");

  const description = [
    `${data.name || "商品"}を出品します。`,
    "",
    `カテゴリ: ${category}`,
    `状態: ${condition}`,
    `付属品: ${accessory}`,
    `購入価格: ${yen(data.originalPrice)}`,
    `目安価格: ${yen(result.recommended)}（相場レンジ ${yen(result.low)}〜${yen(result.high)}）`,
    "",
    `確認ポイント: ${keywords}`,
    data.trust.length ? `対応済み: ${data.trust.map((key) => trustScores[key].label).join("、")}` : "",
    data.notes ? `補足: ${data.notes}` : "",
    "",
    "中古品の場合は写真で状態をご確認ください。気になる点があれば購入前にコメントしてください。",
  ].filter((line) => line !== "").join("\n");

  return { title, description };
}
