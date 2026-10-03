import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { Factor, ItemInput, Todo } from "@/lib/estimator";

export type AppraisalResultSnapshot = {
  recommended: number;
  quick: number;
  market: number;
  premium: number;
  low: number;
  high: number;
  score: number;
  confidence: number;
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    plan: text("plan").default("free").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [check("profiles_plan_check", sql`${table.plan} in ('free', 'pro', 'business')`)],
);

export const appraisals = pgTable(
  "appraisals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    itemName: text("item_name").notNull(),
    category: text("category").notNull(),
    input: jsonb("input").$type<ItemInput>().notNull(),
    result: jsonb("result").$type<AppraisalResultSnapshot>().notNull(),
    logicVersion: text("logic_version").default("v1").notNull(),
    recommendedPrice: integer("recommended_price").notNull(),
    quickPrice: integer("quick_price").notNull(),
    marketPrice: integer("market_price").notNull(),
    premiumPrice: integer("premium_price").notNull(),
    rangeLow: integer("range_low").notNull(),
    rangeHigh: integer("range_high").notNull(),
    score: smallint("score").notNull(),
    confidence: smallint("confidence").notNull(),
    factors: jsonb("factors").$type<Factor[]>().default(sql`'[]'::jsonb`).notNull(),
    todos: jsonb("todos").$type<Todo[]>().default(sql`'[]'::jsonb`).notNull(),
    listingTitle: text("listing_title"),
    listingDescription: text("listing_description"),
    copySource: text("copy_source"),
    soldPrice: integer("sold_price"),
    daysToSell: smallint("days_to_sell"),
    discountCount: smallint("discount_count"),
    soldReportedAt: timestamp("sold_reported_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("appraisals_item_name_check", sql`char_length(${table.itemName}) between 1 and 120`),
    check(
      "appraisals_category_check",
      sql`${table.category} in ('electronics', 'fashion', 'luxury', 'hobby', 'furniture', 'sports', 'baby', 'books')`,
    ),
    check("appraisals_score_check", sql`${table.score} between 0 and 100`),
    check("appraisals_confidence_check", sql`${table.confidence} between 0 and 100`),
    check("appraisals_recommended_price_check", sql`${table.recommendedPrice} >= 0`),
    check("appraisals_quick_price_check", sql`${table.quickPrice} >= 0`),
    check("appraisals_market_price_check", sql`${table.marketPrice} >= 0`),
    check("appraisals_premium_price_check", sql`${table.premiumPrice} >= 0`),
    check("appraisals_range_low_check", sql`${table.rangeLow} >= 0`),
    check("appraisals_range_high_check", sql`${table.rangeHigh} >= 0`),
    check("appraisals_copy_source_check", sql`${table.copySource} is null or ${table.copySource} in ('rule', 'llm')`),
    check("appraisals_sold_price_check", sql`${table.soldPrice} is null or ${table.soldPrice} >= 0`),
    check("appraisals_days_to_sell_check", sql`${table.daysToSell} is null or ${table.daysToSell} between 0 and 365`),
    check("appraisals_discount_count_check", sql`${table.discountCount} is null or ${table.discountCount} between 0 and 50`),
    index("idx_appraisals_user_created").on(table.userId, table.createdAt.desc()),
    index("idx_appraisals_user_category_created").on(table.userId, table.category, table.createdAt.desc()),
    index("idx_appraisals_item_name_trgm").using("gin", table.itemName.asc().op("gin_trgm_ops")),
    index("idx_appraisals_category").on(table.category),
  ],
);

export const usageEvents = pgTable(
  "usage_events",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
    eventType: text("event_type").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    anonymousId: uuid("anonymous_id"),
    sessionId: uuid("session_id"),
    appraisalId: uuid("appraisal_id").references(() => appraisals.id, { onDelete: "set null" }),
    properties: jsonb("properties").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
  },
  (table) => [
    check(
      "usage_events_event_type_check",
      sql`${table.eventType} in ('appraisal_form_started', 'appraisal_completed', 'appraisal_saved', 'copy_generated', 'copy_copied', 'sale_reported', 'signup_completed')`,
    ),
    index("idx_usage_events_type_time").on(table.eventType, table.occurredAt.desc()),
    index("idx_usage_events_user").on(table.userId, table.occurredAt.desc()),
    index("idx_usage_events_anon").on(table.anonymousId, table.occurredAt.desc()),
  ],
);
