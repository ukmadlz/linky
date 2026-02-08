-- Migration: Update accounts table for better-auth compatibility
-- Adds accountId, providerId, and password fields

-- Drop and recreate accounts table with correct schema
DROP TABLE IF EXISTS accounts CASCADE;

CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMP,
    refresh_token_expires_at TIMESTAMP,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX accounts_user_id_idx ON accounts(user_id);

-- Make password nullable in users table (better-auth stores it in accounts table)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
