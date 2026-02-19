CREATE TABLE "custom_domains" (
	"id" text PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"domain" varchar(253) NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"ssl_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_domains_page_id_idx" ON "custom_domains" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "custom_domains_domain_idx" ON "custom_domains" USING btree ("domain");