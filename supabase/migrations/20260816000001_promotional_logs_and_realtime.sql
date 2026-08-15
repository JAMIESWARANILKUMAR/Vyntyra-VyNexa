-- 20260816000001_promotional_logs_and_realtime.sql

-- 1. Create automated_emails_log table for tracking promotional emails
CREATE TABLE IF NOT EXISTS public.automated_emails_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email text NOT NULL,
  recipient_name text,
  university_name text,
  domain text,
  sub_domain text,
  subject text,
  status text DEFAULT 'sent',
  provider text,
  resend_id text,
  error_message text,
  sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for automated_emails_log
ALTER TABLE public.automated_emails_log ENABLE ROW LEVEL SECURITY;

-- Policies for automated_emails_log
CREATE POLICY "Admins can view automated email logs" ON public.automated_emails_log FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert automated email logs" ON public.automated_emails_log FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 2. Enable Realtime for applications table so interns update live
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'applications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
    END IF;
  END
  $$;
COMMIT;
