-- Migration: Fix subscriptions table schema
-- Adds stripe_price_id column
-- Renames period columns
-- Drops unused columns

-- Add stripe_price_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions'
        AND column_name = 'stripe_price_id'
    ) THEN
        ALTER TABLE subscriptions
        ADD COLUMN stripe_price_id VARCHAR(255) NOT NULL DEFAULT 'price_unknown';
    END IF;
END $$;

-- Rename current_period_start to period_start
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions'
        AND column_name = 'current_period_start'
    ) THEN
        ALTER TABLE subscriptions
        RENAME COLUMN current_period_start TO period_start;
    END IF;
END $$;

-- Rename current_period_end to period_end
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscriptions'
        AND column_name = 'current_period_end'
    ) THEN
        ALTER TABLE subscriptions
        RENAME COLUMN current_period_end TO period_end;
    END IF;
END $$;

-- Drop unused columns
ALTER TABLE subscriptions DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS price_id;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS quantity;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS cancel_at_period_end;
