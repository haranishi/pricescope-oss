import { describe, expect, it } from "vitest";
import { calculate, type ItemInput } from "./estimator";

function prices(input: ItemInput) {
  const result = calculate(input);
  return {
    market: result.market,
    quick: result.quick,
    recommended: result.recommended,
    premium: result.premium,
    low: result.low,
    high: result.high,
    score: result.score,
    confidence: result.confidence,
  };
}

describe("estimator golden cases", () => {
  it("家電・美品・早売り", () => {
    expect(prices({
      name: "スマートフォン",
      category: "electronics",
      brandTier: "standard",
      originalPrice: 100_000,
      ageYears: 1,
      condition: "likeNew",
      accessories: "complete",
      demand: "hot",
      rarity: "normal",
      speed: "fast",
      seasonality: "peak",
      trust: ["tested", "photos", "receipt"],
      notes: "動作確認済み",
    })).toEqual({ market: 86_000, quick: 72_000, recommended: 80_000, premium: 89_000, low: 71_000, high: 101_000, score: 77, confidence: 86 });
  });

  it("ファッション・傷あり・高めで待つ", () => {
    expect(prices({
      name: "コート",
      category: "fashion",
      brandTier: "niche",
      originalPrice: 50_000,
      ageYears: 5,
      condition: "fair",
      accessories: "none",
      demand: "low",
      rarity: "common",
      speed: "patient",
      seasonality: "off",
      trust: [],
      notes: "",
    })).toEqual({ market: 4_500, quick: 4_000, recommended: 5_000, premium: 5_500, low: 3_500, high: 5_500, score: 18, confidence: 58 });
  });

  it("限定ホビー・新品・通常出品", () => {
    expect(prices({
      name: "限定フィギュア",
      category: "hobby",
      brandTier: "premium",
      originalPrice: 24_000,
      ageYears: 0.5,
      condition: "new",
      accessories: "complete",
      demand: "normal",
      rarity: "limited",
      speed: "normal",
      seasonality: "neutral",
      trust: ["cleaned", "photos", "defects"],
      notes: "未開封",
    })).toEqual({ market: 24_000, quick: 21_000, recommended: 24_000, premium: 27_000, low: 19_500, high: 28_500, score: 83, confidence: 86 });
  });
});
