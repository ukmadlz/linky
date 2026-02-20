-- Webhook endpoints
CREATE TABLE IF NOT EXISTS "webhook_endpoints" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"secret_vault_id" text NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"endpoint_id" text NOT NULL,
	"event" varchar(100) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status_code" integer,
	"response" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_webhook_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."webhook_endpoints"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_endpoints_user_id_idx" ON "webhook_endpoints" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_endpoint_id_idx" ON "webhook_deliveries" USING btree ("endpoint_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_event_idx" ON "webhook_deliveries" USING btree ("event");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_created_at_idx" ON "webhook_deliveries" USING btree ("created_at");
--> statement-breakpoint
-- Sub-slug for per-user sub-pages
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "sub_slug" varchar(100);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pages_user_sub_slug_idx" ON "pages" USING btree ("user_id", "sub_slug");
