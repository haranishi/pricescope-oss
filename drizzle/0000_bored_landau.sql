CREATE TABLE "appraisals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_name" text NOT NULL,
	"category" text NOT NULL,
	"input" jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"logic_version" text DEFAULT 'v1' NOT NULL,
	"recommended_price" integer NOT NULL,
	"quick_price" integer NOT NULL,
	"market_price" integer NOT NULL,
	"premium_price" integer NOT NULL,
	"range_low" integer NOT NULL,
	"range_high" integer NOT NULL,
	"score" smallint NOT NULL,
	"confidence" smallint NOT NULL,
	"factors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"todos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"listing_title" text,
	"listing_description" text,
	"copy_source" text,
	"sold_price" integer,
	"days_to_sell" smallint,
	"discount_count" smallint,
	"sold_reported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appraisals_item_name_check" CHECK (char_length("appraisals"."item_name") between 1 and 120),
	CONSTRAINT "appraisals_category_check" CHECK ("appraisals"."category" in ('electronics', 'fashion', 'luxury', 'hobby', 'furniture', 'sports', 'baby', 'books')),
	CONSTRAINT "appraisals_score_check" CHECK ("appraisals"."score" between 0 and 100),
	CONSTRAINT "appraisals_confidence_check" CHECK ("appraisals"."confidence" between 0 and 100),
	CONSTRAINT "appraisals_recommended_price_check" CHECK ("appraisals"."recommended_price" >= 0),
	CONSTRAINT "appraisals_quick_price_check" CHECK ("appraisals"."quick_price" >= 0),
	CONSTRAINT "appraisals_market_price_check" CHECK ("appraisals"."market_price" >= 0),
	CONSTRAINT "appraisals_premium_price_check" CHECK ("appraisals"."premium_price" >= 0),
	CONSTRAINT "appraisals_range_low_check" CHECK ("appraisals"."range_low" >= 0),
	CONSTRAINT "appraisals_range_high_check" CHECK ("appraisals"."range_high" >= 0),
	CONSTRAINT "appraisals_copy_source_check" CHECK ("appraisals"."copy_source" is null or "appraisals"."copy_source" in ('rule', 'llm')),
	CONSTRAINT "appraisals_sold_price_check" CHECK ("appraisals"."sold_price" is null or "appraisals"."sold_price" >= 0),
	CONSTRAINT "appraisals_days_to_sell_check" CHECK ("appraisals"."days_to_sell" is null or "appraisals"."days_to_sell" between 0 and 365),
	CONSTRAINT "appraisals_discount_count_check" CHECK ("appraisals"."discount_count" is null or "appraisals"."discount_count" between 0 and 50)
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_plan_check" CHECK ("profiles"."plan" in ('free', 'pro', 'business'))
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "usage_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"user_id" uuid,
	"anonymous_id" uuid,
	"session_id" uuid,
	"appraisal_id" uuid,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "usage_events_event_type_check" CHECK ("usage_events"."event_type" in ('appraisal_form_started', 'appraisal_completed', 'appraisal_saved', 'copy_generated', 'copy_copied', 'sale_reported', 'signup_completed'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appraisals" ADD CONSTRAINT "appraisals_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_appraisal_id_appraisals_id_fk" FOREIGN KEY ("appraisal_id") REFERENCES "public"."appraisals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_appraisals_user_created" ON "appraisals" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_appraisals_user_category_created" ON "appraisals" USING btree ("user_id","category","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_appraisals_category" ON "appraisals" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_usage_events_type_time" ON "usage_events" USING btree ("event_type","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_usage_events_user" ON "usage_events" USING btree ("user_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_usage_events_anon" ON "usage_events" USING btree ("anonymous_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");