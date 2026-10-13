/*
# Create LivePoll schema (single-tenant, no auth)

1. New Tables
- `polls` — A poll/Q&A session created by a host.
  - `id` (uuid, primary key)
  - `code` (text, unique) — 6-character join code for participants
  - `title` (text, not null) — the question being asked
  - `status` (text, not null, default 'active') — 'active' or 'closed'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- `options` — The answer choices for a poll.
  - `id` (uuid, primary key)
  - `poll_id` (uuid, FK to polls, ON DELETE CASCADE)
  - `text` (text, not null)
  - `position` (integer, default 0) — display order
  - `created_at` (timestamptz)

- `votes` — Individual votes cast by participants.
  - `id` (uuid, primary key)
  - `poll_id` (uuid, FK to polls, ON DELETE CASCADE)
  - `option_id` (uuid, FK to options, ON DELETE CASCADE)
  - `voter_id` (uuid, not null) — anonymous per-session identifier
  - `created_at` (timestamptz)
  - Unique constraint on (poll_id, voter_id) to prevent double-voting

2. Indexes
- `idx_polls_code` — fast lookup by join code
- `idx_options_poll_id` — fast option listing per poll
- `idx_votes_poll_id` — fast vote counting per poll
- `idx_votes_option_id` — fast vote counting per option

3. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD on all tables (intentionally public, no-auth app).
- Anyone can create polls, add options, and vote (no sign-in required).

4. Important Notes
- This is a no-auth single-tenant app — no user_id columns, no auth.uid() checks.
- Voter deduplication is enforced by the unique constraint on (poll_id, voter_id).
- Poll status can be toggled between 'active' and 'closed' by anyone (no ownership).
- All realtime subscriptions work through Supabase's built-in realtime replication.
*/

CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES options(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (poll_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_polls_code ON polls(code);
CREATE INDEX IF NOT EXISTS idx_options_poll_id ON options(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_option_id ON votes(option_id);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Polls: full CRUD for anon + authenticated
DROP POLICY IF EXISTS "anon_select_polls" ON polls;
CREATE POLICY "anon_select_polls" ON polls FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_polls" ON polls;
CREATE POLICY "anon_insert_polls" ON polls FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_polls" ON polls;
CREATE POLICY "anon_update_polls" ON polls FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_polls" ON polls;
CREATE POLICY "anon_delete_polls" ON polls FOR DELETE
  TO anon, authenticated USING (true);

-- Options: full CRUD for anon + authenticated
DROP POLICY IF EXISTS "anon_select_options" ON options;
CREATE POLICY "anon_select_options" ON options FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_options" ON options;
CREATE POLICY "anon_insert_options" ON options FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_options" ON options;
CREATE POLICY "anon_update_options" ON options FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_options" ON options;
CREATE POLICY "anon_delete_options" ON options FOR DELETE
  TO anon, authenticated USING (true);

-- Votes: full CRUD for anon + authenticated
DROP POLICY IF EXISTS "anon_select_votes" ON votes;
CREATE POLICY "anon_select_votes" ON votes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_votes" ON votes;
CREATE POLICY "anon_insert_votes" ON votes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_votes" ON votes;
CREATE POLICY "anon_update_votes" ON votes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_votes" ON votes;
CREATE POLICY "anon_delete_votes" ON votes FOR DELETE
  TO anon, authenticated USING (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE options;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
