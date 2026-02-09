ALTER TABLE "accounts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verifications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE IF EXISTS "accounts" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "sessions" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "verifications" CASCADE;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_username_unique";
EXCEPTION
 WHEN undefined_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "link_clicks" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "link_clicks" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "link_clicks" ALTER COLUMN "link_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "links" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "links" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "links" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified') THEN
  ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;
 END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='workos_user_id') THEN
  ALTER TABLE "users" ADD COLUMN "workos_user_id" varchar(255);
 END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='oauth_provider') THEN
  ALTER TABLE "users" ADD COLUMN "oauth_provider" varchar(50);
 END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='profile_picture_url') THEN
  ALTER TABLE "users" ADD COLUMN "profile_picture_url" text;
 END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_at') THEN
  ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;
 END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_workos_user_id_unique" UNIQUE("workos_user_id");
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;