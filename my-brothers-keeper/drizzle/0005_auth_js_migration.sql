-- Auth.js (NextAuth) migration: replaces Replit Auth with email magic-link auth via Resend.
-- Run this in Neon SQL Editor (or via `pnpm db:push`) after merging the auth swap PR.

-- 1. Drop the old Replit/connect-pg-simple session table.
--    The new sessions table below has a different schema.
DROP TABLE IF EXISTS sessions;

-- 2. Add Auth.js required columns to the existing users table.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;

-- 3. Accounts table (required by @auth/drizzle-adapter, used when OAuth providers are added later).
CREATE TABLE IF NOT EXISTS accounts (
  user_id VARCHAR NOT NULL,
  type VARCHAR(32) NOT NULL,
  provider VARCHAR(64) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(32),
  scope TEXT,
  id_token TEXT,
  session_state TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_account_id_idx
  ON accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);

-- 4. New sessions table (Auth.js schema — session_token PK, links to user_id).
CREATE TABLE sessions (
  session_token VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  expires TIMESTAMP NOT NULL
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);

-- 5. Verification tokens — temporarily stores the random token sent in each magic-link email.
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(320) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS verification_tokens_identifier_token_idx
  ON verification_tokens(identifier, token);
