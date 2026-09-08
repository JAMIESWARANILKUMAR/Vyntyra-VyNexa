-- ==============================================================================
-- VyNexa Connect: Supabase Database Schema Update Script
-- Migration: 20260908124500_tasks_teams_and_b2b_email_logs.sql
-- Purpose: Ensures all columns and tables for Collaborative Team Tasks,
--          B2B Outreach Email Logging, and Real-Time Task Notifications exist.
-- Safe to run multiple times: uses "IF NOT EXISTS" and safe alter commands.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Tasks Table: Ensure Collaborative Team & Extended Fields Exist
-- ------------------------------------------------------------------------------
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS team_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS team_name TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS team_member_names TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignment_mode TEXT DEFAULT 'individual';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_meet_link TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS target_user_id UUID;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'intern';

-- Document and submission template URLs
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_doc_url TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_file_url TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS report_template_url TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS ppt_template_url TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Beginner';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_pool_task BOOLEAN DEFAULT false;

-- Create indexes on tasks for lightning-fast team and assignee lookups
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON public.tasks (team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_target_user_id ON public.tasks (target_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);

-- ------------------------------------------------------------------------------
-- 2. User Notifications Table: Ensure Real-Time In-App Alerts Exist
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist in case user_notifications was already created
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications (created_at DESC);

-- Enable RLS for notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'Users can view their own notifications') THEN
    CREATE POLICY "Users can view their own notifications" ON public.user_notifications 
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'Admins can manage notifications') THEN
    CREATE POLICY "Admins can manage notifications" ON public.user_notifications 
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Automated Emails Log: Ensure B2B & Promotional Outreach Dispatch Logs Exist
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automated_emails_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  university_or_organization TEXT,
  domain TEXT,
  sub_domain TEXT,
  email_template_id TEXT,
  subject TEXT,
  status TEXT DEFAULT 'sent',
  delivery_status TEXT DEFAULT 'sent',
  provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,
  resend_id TEXT,
  error_message TEXT,
  sent_date TEXT,
  sent_time TEXT,
  sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist on automated_emails_log
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS university_or_organization TEXT;
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS sub_domain TEXT;
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS email_template_id TEXT;
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'sent';
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'resend';
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS provider_message_id TEXT;
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS resend_id TEXT;
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS sent_date TEXT;
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS sent_time TEXT;
ALTER TABLE public.automated_emails_log ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_automated_emails_log_recipient ON public.automated_emails_log (recipient_email);
CREATE INDEX IF NOT EXISTS idx_automated_emails_log_sent_at ON public.automated_emails_log (sent_at DESC);

-- Enable RLS on automated_emails_log
ALTER TABLE public.automated_emails_log ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automated_emails_log' AND policyname = 'Admins can view email logs') THEN
    CREATE POLICY "Admins can view email logs" ON public.automated_emails_log 
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automated_emails_log' AND policyname = 'Admins can insert email logs') THEN
    CREATE POLICY "Admins can insert email logs" ON public.automated_emails_log 
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;
