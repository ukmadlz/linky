-- Migration: Add updated_at columns to sessions and verifications tables
-- Also updates verifications.identifier to TEXT type

-- Add updated_at to sessions table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE sessions
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- Update verifications.identifier to TEXT type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'verifications'
        AND column_name = 'identifier'
    ) THEN
        ALTER TABLE verifications
        ALTER COLUMN identifier TYPE TEXT;
    END IF;
END $$;

-- Add updated_at to verifications table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'verifications'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE verifications
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;
END $$;
