-- ─── Scheduled Selection Emails Schema ───────────────────────────
-- Run this script in your Supabase Dashboard SQL Editor!

CREATE TABLE IF NOT EXISTS public.scheduled_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    send_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast queue processing
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status_send_at ON public.scheduled_emails(status, send_at);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
