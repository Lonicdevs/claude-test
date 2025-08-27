-- CreateTable
CREATE TABLE "operators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand_name" TEXT NOT NULL,
    "legal_name" TEXT,
    "tagline" TEXT,
    "about_text" TEXT,
    "hq_address_json" JSONB,
    "phone" TEXT,
    "emails" JSONB,
    "social_urls" JSONB,
    "brand_tokens" JSONB,
    "logo_urls" JSONB,
    "brand_colors" JSONB,
    "company_ids" JSONB,
    "primary_domain" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "domain_candidates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "verified_at" DATETIME,
    "rejected_at" DATETIME,
    "rejection_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "domain_candidates_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "websites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "canonical_url" TEXT NOT NULL,
    "robots_txt_url" TEXT,
    "sitemap_urls" JSONB,
    "first_seen_at" DATETIME NOT NULL,
    "last_seen_at" DATETIME NOT NULL,
    "last_crawl_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "websites_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "offices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "building_name" TEXT,
    "full_address" TEXT,
    "address_json" JSONB,
    "geocode_json" JSONB,
    "neighbourhood" TEXT,
    "contact_json" JSONB,
    "opening_hours_json" JSONB,
    "amenities" JSONB,
    "photos" JSONB,
    "virtual_tour_urls" JSONB,
    "transport_notes" TEXT,
    "source_page_ids" JSONB,
    "last_extraction_id" TEXT,
    "next_crawl_at" DATETIME,
    "crawl_priority" TEXT NOT NULL DEFAULT 'medium',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "offices_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "space_type" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "capacity_min" INTEGER,
    "capacity_max" INTEGER,
    "availability_notes" TEXT,
    "min_term" TEXT,
    "term_options" JSONB,
    "pricing_json" JSONB,
    "inclusions" JSONB,
    "add_ons" JSONB,
    "booking_link" TEXT,
    "last_extraction_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "products_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "products_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meeting_rooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "layouts" JSONB,
    "rates_json" JSONB,
    "amenities" JSONB,
    "photos" JSONB,
    "booking_link" TEXT,
    "last_extraction_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "meeting_rooms_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "meeting_rooms_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "website_id" TEXT NOT NULL,
    "canonical_url" TEXT NOT NULL,
    "page_type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "meta_description" TEXT,
    "last_http_status" INTEGER,
    "etag" TEXT,
    "last_modified" TEXT,
    "content_hash" TEXT,
    "last_seen_at" DATETIME NOT NULL,
    "robots_directives" JSONB,
    "sitemap_discovered" BOOLEAN NOT NULL DEFAULT false,
    "crawl_priority" TEXT NOT NULL DEFAULT 'medium',
    CONSTRAINT "pages_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "extractions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "page_id" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "scope_id" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL,
    "extracted_json" JSONB NOT NULL,
    "extraction_hash" TEXT NOT NULL,
    "confidence_score" REAL,
    "selector_notes" JSONB,
    "extracted_at" DATETIME NOT NULL,
    "scraper_version" TEXT NOT NULL,
    CONSTRAINT "extractions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "raw_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "page_id" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "s3_bucket" TEXT NOT NULL,
    "fetch_tool" TEXT NOT NULL,
    "http_status" INTEGER NOT NULL,
    "headers_json" JSONB NOT NULL,
    "timing_json" JSONB,
    "file_size_bytes" INTEGER NOT NULL,
    "captured_at" DATETIME NOT NULL,
    CONSTRAINT "raw_snapshots_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "diffs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "extraction_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "change_type" TEXT NOT NULL,
    "diff_at" DATETIME NOT NULL,
    CONSTRAINT "diffs_extraction_id_fkey" FOREIGN KEY ("extraction_id") REFERENCES "extractions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crawl_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operator_id" TEXT,
    "run_type" TEXT NOT NULL,
    "started_at" DATETIME NOT NULL,
    "finished_at" DATETIME,
    "status" TEXT NOT NULL,
    "stats_json" JSONB,
    "error_message" TEXT,
    "triggered_by" TEXT,
    CONSTRAINT "crawl_runs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rescrape_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "office_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "requested_at" DATETIME NOT NULL,
    "scheduled_for" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" DATETIME,
    "error_message" TEXT,
    "completed_at" DATETIME,
    CONSTRAINT "rescrape_queue_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metric_name" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "tags_json" JSONB,
    "recorded_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context_json" JSONB,
    "stack_trace" TEXT,
    "logged_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "domain_candidates_operator_id_domain_key" ON "domain_candidates"("operator_id", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "websites_operator_id_domain_key" ON "websites"("operator_id", "domain");

-- CreateIndex
CREATE INDEX "offices_operator_id_idx" ON "offices"("operator_id");

-- CreateIndex
CREATE INDEX "offices_next_crawl_at_idx" ON "offices"("next_crawl_at");

-- CreateIndex
CREATE INDEX "products_operator_id_idx" ON "products"("operator_id");

-- CreateIndex
CREATE INDEX "products_office_id_idx" ON "products"("office_id");

-- CreateIndex
CREATE INDEX "products_space_type_idx" ON "products"("space_type");

-- CreateIndex
CREATE INDEX "meeting_rooms_operator_id_idx" ON "meeting_rooms"("operator_id");

-- CreateIndex
CREATE INDEX "meeting_rooms_office_id_idx" ON "meeting_rooms"("office_id");

-- CreateIndex
CREATE INDEX "pages_page_type_idx" ON "pages"("page_type");

-- CreateIndex
CREATE INDEX "pages_last_seen_at_idx" ON "pages"("last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "pages_website_id_canonical_url_key" ON "pages"("website_id", "canonical_url");

-- CreateIndex
CREATE INDEX "extractions_scope_type_scope_id_idx" ON "extractions"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "extractions_extracted_at_idx" ON "extractions"("extracted_at");

-- CreateIndex
CREATE INDEX "raw_snapshots_content_hash_idx" ON "raw_snapshots"("content_hash");

-- CreateIndex
CREATE INDEX "raw_snapshots_captured_at_idx" ON "raw_snapshots"("captured_at");

-- CreateIndex
CREATE INDEX "diffs_entity_type_entity_id_idx" ON "diffs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "diffs_diff_at_idx" ON "diffs"("diff_at");

-- CreateIndex
CREATE INDEX "crawl_runs_status_idx" ON "crawl_runs"("status");

-- CreateIndex
CREATE INDEX "crawl_runs_started_at_idx" ON "crawl_runs"("started_at");

-- CreateIndex
CREATE INDEX "rescrape_queue_status_scheduled_for_idx" ON "rescrape_queue"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "rescrape_queue_office_id_idx" ON "rescrape_queue"("office_id");

-- CreateIndex
CREATE INDEX "system_metrics_metric_name_recorded_at_idx" ON "system_metrics"("metric_name", "recorded_at");

-- CreateIndex
CREATE INDEX "error_logs_level_logged_at_idx" ON "error_logs"("level", "logged_at");
