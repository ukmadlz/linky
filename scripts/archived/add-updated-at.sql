-- Add updatedAt columns to sessions and verifications tables

ALTER TABLE sessions ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE verifications ALTER COLUMN identifier TYPE TEXT;
ALTER TABLE verifications ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
