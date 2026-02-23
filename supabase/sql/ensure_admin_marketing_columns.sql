-- Idempotent safety script for existing projects.
-- Run this once in Supabase SQL Editor if the columns are missing.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_at TIMESTAMPTZ;

UPDATE users
SET is_admin = TRUE
WHERE lower(email) = 'admirfric@gmail.com';
