-- 20261018220000_meet_rooms_table.sql
-- Create meet_rooms table in Supabase PostgreSQL to support Vyntyra Meet rooms
-- when Cloudflare D1 is unavailable or running in non-worker environments.

CREATE TABLE IF NOT EXISTS public.meet_rooms (
  id text PRIMARY KEY,
  title text NOT NULL,
  host_id text,
  status text DEFAULT 'active',
  max_participants integer DEFAULT 40,
  settings text DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at timestamp with time zone
);

-- Enable Row Level Security
ALTER TABLE public.meet_rooms ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view active meetings
CREATE POLICY "meet_rooms are viewable by authenticated users"
  ON public.meet_rooms FOR SELECT
  USING (true);

-- Allow authenticated users (hosts and admins) to insert meeting rooms
CREATE POLICY "meet_rooms can be inserted by authenticated users"
  ON public.meet_rooms FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to update meeting rooms (e.g., end meeting)
CREATE POLICY "meet_rooms can be updated by authenticated users"
  ON public.meet_rooms FOR UPDATE
  USING (true);

-- Explicit Grants for Supabase Data API (PostgREST / supabase-js)
GRANT SELECT ON public.meet_rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meet_rooms TO authenticated;
GRANT ALL ON public.meet_rooms TO service_role;

