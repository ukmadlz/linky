-- Migration: Convert UUID IDs to TEXT for Better-Auth compatibility
-- This will DROP ALL DATA - only run in development!

-- Drop all tables to remove foreign key constraints
DROP TABLE IF EXISTS link_clicks CASCADE;
DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table with TEXT id
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50),
    password TEXT NOT NULL,
    name VARCHAR(100),
    email_verified BOOLEAN DEFAULT false,
    bio TEXT,
    avatar_url TEXT,
    theme TEXT DEFAULT '{}',
    is_pro BOOLEAN DEFAULT false NOT NULL,
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_username_idx ON users(username);

-- Recreate links table with TEXT user_id
CREATE TABLE links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    icon VARCHAR(100),
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true NOT NULL,
    clicks INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX links_user_id_idx ON links(user_id);
CREATE INDEX links_position_idx ON links(position);

-- Recreate link_clicks table
CREATE TABLE link_clicks (
    id TEXT PRIMARY KEY,
    link_id TEXT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    referrer TEXT,
    user_agent TEXT,
    country VARCHAR(2),
    city VARCHAR(100),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX link_clicks_link_id_idx ON link_clicks(link_id);
CREATE INDEX link_clicks_timestamp_idx ON link_clicks(timestamp);

-- Recreate subscriptions table
CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    price_id VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    cancel_at_period_end BOOLEAN DEFAULT false,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);

-- Recreate sessions table for better-auth
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_token_idx ON sessions(token);

-- Recreate accounts table for OAuth
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at TIMESTAMP,
    token_type VARCHAR(50),
    scope TEXT,
    id_token TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX accounts_user_id_idx ON accounts(user_id);
CREATE INDEX accounts_provider_idx ON accounts(provider, provider_account_id);

-- Recreate verifications table
CREATE TABLE verifications (
    id TEXT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX verifications_identifier_idx ON verifications(identifier);
