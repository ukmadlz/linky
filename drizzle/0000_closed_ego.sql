CREATE TYPE "public"."block_type" AS ENUM('link', 'text', 'embed', 'social_icons', 'divider', 'custom_code');--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" text PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"parent_id" text,
	"type" "block_type" NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scheduled_start" timestamp,
	"scheduled_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "click_events" (
	"id" text PRIMARY KEY NOT NULL,
	"block_id" text NOT NULL,
	"page_id" text NOT NULL,
	"destination_url" text,
	"referrer" text,
	"user_agent" text,
	"browser" varchar(50),
	"os" varchar(50),
	"device" varchar(20),
	"country" varchar(2),
	"region" varchar(100),
	"city" varchar(100),
	"language" varchar(20),
	"is_bot" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_views" (
	"id" text PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"referrer" text,
	"user_agent" text,
	"browser" varchar(50),
	"os" varchar(50),
	"device" varchar(20),
	"country" varchar(2),
	"region" varchar(100),
	"city" varchar(100),
	"language" varchar(20),
	"is_bot" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(200),
	"description" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"theme_id" varchar(50) DEFAULT 'default' NOT NULL,
	"theme_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seo_title" varchar(200),
	"seo_description" text,
	"og_image_url" text,
	"milestones_sent" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50),
	"name" varchar(100),
	"bio" text,
	"avatar_url" text,
	"workos_user_id" varchar(255),
	"is_pro" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_workos_user_id_unique" UNIQUE("workos_user_id")
);
--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocks_page_id_idx" ON "blocks" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "blocks_page_id_position_idx" ON "blocks" USING btree ("page_id","position");--> statement-breakpoint
CREATE INDEX "blocks_parent_id_idx" ON "blocks" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "click_events_block_id_idx" ON "click_events" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "click_events_page_id_idx" ON "click_events" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "click_events_timestamp_idx" ON "click_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "click_events_page_id_timestamp_idx" ON "click_events" USING btree ("page_id","timestamp");--> statement-breakpoint
CREATE INDEX "page_views_page_id_idx" ON "page_views" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "page_views_timestamp_idx" ON "page_views" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "page_views_page_id_timestamp_idx" ON "page_views" USING btree ("page_id","timestamp");--> statement-breakpoint
CREATE INDEX "pages_user_id_idx" ON "pages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");