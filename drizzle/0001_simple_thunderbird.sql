CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "idx_appraisals_item_name_trgm" ON "appraisals" USING gin ("item_name" gin_trgm_ops);
