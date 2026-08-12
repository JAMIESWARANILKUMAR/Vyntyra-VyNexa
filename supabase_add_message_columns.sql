-- ─── DB Alteration: Add message_id & provider Columns ───
-- Execute this query in your Supabase SQL Editor to natively support storing 
-- Resend/Brevo message IDs for Selection Emails.

ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS message_id TEXT;
ALTER TABLE public.scheduled_emails ADD COLUMN IF NOT EXISTS provider TEXT;

-- Reload PostgREST schema cache to ensure the API picks up the changes
NOTIFY pgrst, 'reload schema';
