-- ══════════════════════════════════════════════════════════════════════════
-- Agent Marketplace — Supabase Schema
-- Run this in your Supabase SQL editor (Database → SQL Editor → New query)
-- ══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Jobs table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL CHECK (length(title) >= 5),
  description  TEXT NOT NULL CHECK (length(description) >= 20),
  skills       TEXT[] NOT NULL DEFAULT '{}',
  budget_min   INTEGER NOT NULL CHECK (budget_min > 0),
  budget_max   INTEGER NOT NULL CHECK (budget_max >= budget_min),
  deadline     TIMESTAMPTZ NOT NULL,
  poster_address TEXT NOT NULL,
  escrow_note  TEXT,
  status       TEXT NOT NULL DEFAULT 'open'
               CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status);
CREATE INDEX IF NOT EXISTS jobs_poster_idx ON jobs (poster_address);
CREATE INDEX IF NOT EXISTS jobs_created_idx ON jobs (created_at DESC);

-- ─── Applications table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  agent_id      INTEGER NOT NULL,
  agent_address TEXT NOT NULL,
  x402_tx_hash  TEXT NOT NULL DEFAULT '',
  message       TEXT NOT NULL CHECK (length(message) >= 10),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, agent_address)   -- one application per agent per job
);

CREATE INDEX IF NOT EXISTS apps_job_idx ON applications (job_id);
CREATE INDEX IF NOT EXISTS apps_agent_idx ON applications (agent_address);

-- ─── Agents table (off-chain profile mirror) ───────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id      INTEGER NOT NULL,
  wallet_address TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL CHECK (length(name) >= 2),
  description   TEXT NOT NULL CHECK (length(description) >= 10),
  skills        TEXT[] NOT NULL DEFAULT '{}',
  agent_uri     TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agents_wallet_idx ON agents (wallet_address);
CREATE INDEX IF NOT EXISTS agents_skills_idx ON agents USING GIN (skills);

-- ─── Row Level Security (for production) ───────────────────────────────────
-- Enable RLS — service key bypasses it, anon key respects it

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read open jobs
CREATE POLICY "jobs_public_read" ON jobs FOR SELECT USING (true);

-- Allow anyone to read agents
CREATE POLICY "agents_public_read" ON agents FOR SELECT USING (true);

-- Applications are only visible via API (service key) — not exposed to anon
-- (No anon SELECT policy on applications)

-- ─── Helpful views ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW job_stats AS
SELECT
  j.id,
  j.title,
  j.status,
  j.poster_address,
  j.budget_min,
  j.budget_max,
  j.deadline,
  j.created_at,
  COUNT(a.id) AS application_count
FROM jobs j
LEFT JOIN applications a ON a.job_id = j.id
GROUP BY j.id;
