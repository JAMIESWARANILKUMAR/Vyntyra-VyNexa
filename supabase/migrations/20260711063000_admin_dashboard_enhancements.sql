-- ============================================================
-- Migration: Admin Dashboard Enhancements
-- Created:   2026-07-11
-- Description:
--   1. Create job_postings table with RLS + updated_at trigger
--   2. Create admin_notifications table with RLS + index
--   3. Create visitor_counts table with RLS + seed data
--   4. Alter applications table to add job_posting_id FK
-- ============================================================

-- ============================================================
-- 1. job_postings
-- ============================================================
CREATE TABLE public.job_postings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  department  TEXT        NOT NULL,
  location    TEXT        NOT NULL DEFAULT 'Remote',
  type        TEXT        NOT NULL DEFAULT 'Full-time',
  description TEXT        NOT NULL,
  requirements TEXT,
  salary_range TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT ON public.job_postings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_postings TO authenticated;
GRANT ALL ON public.job_postings TO service_role;

-- RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Public can read active postings
CREATE POLICY "Public can read active job postings"
  ON public.job_postings
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admins can insert
CREATE POLICY "Admins can insert job postings"
  ON public.job_postings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update
CREATE POLICY "Admins can update job postings"
  ON public.job_postings
  FOR UPDATE
  TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete job postings"
  ON public.job_postings
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger (reuse existing function)
CREATE TRIGGER set_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();


-- ============================================================
-- 2. admin_notifications
-- ============================================================
CREATE TABLE public.admin_notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  metadata   JSONB       DEFAULT '{}',
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;

-- RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON public.admin_notifications
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update (mark read)
CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications
  FOR UPDATE
  TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert notifications
CREATE POLICY "Admins can insert notifications"
  ON public.admin_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Index for fast reverse-chronological queries
CREATE INDEX idx_admin_notifications_created_at
  ON public.admin_notifications (created_at DESC);


-- ============================================================
-- 3. visitor_counts
-- ============================================================
CREATE TABLE public.visitor_counts (
  page_key   TEXT        PRIMARY KEY,
  count      BIGINT      NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.visitor_counts TO anon, authenticated;
GRANT ALL ON public.visitor_counts TO service_role;

-- RLS
ALTER TABLE public.visitor_counts ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can read visitor counts"
  ON public.visitor_counts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can upsert
CREATE POLICY "Anyone can upsert visitor counts"
  ON public.visitor_counts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can update
CREATE POLICY "Anyone can update visitor counts"
  ON public.visitor_counts
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Seed initial row
INSERT INTO public.visitor_counts (page_key, count)
VALUES ('home', 0)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 4. Alter applications – add job_posting_id FK
-- ============================================================
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS job_posting_id UUID
    REFERENCES public.job_postings(id) ON DELETE SET NULL;
