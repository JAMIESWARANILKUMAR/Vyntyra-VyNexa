-- 1. Drop trigger first
DROP TRIGGER IF EXISTS tg_applications_validate_transition ON public.applications;
DROP FUNCTION IF EXISTS public.tg_validate_status_transition();

-- 2. Alter column types to TEXT
ALTER TABLE public.applications ALTER COLUMN status TYPE TEXT;
ALTER TABLE public.application_status_events ALTER COLUMN from_status TYPE TEXT;
ALTER TABLE public.application_status_events ALTER COLUMN to_status TYPE TEXT;

-- For status_email_templates, we need to drop the primary key constraint, alter type, and recreate it
ALTER TABLE public.status_email_templates DROP CONSTRAINT IF EXISTS status_email_templates_pkey;
ALTER TABLE public.status_email_templates ALTER COLUMN status TYPE TEXT;
ALTER TABLE public.status_email_templates ADD PRIMARY KEY (status);

-- 3. Drop the enum type to clean up
DROP TYPE IF EXISTS public.application_status;

-- 4. Add columns to applications table
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS interviewer_name TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS meet_link TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS meeting_time TIMESTAMP WITH TIME ZONE;

-- 5. Insert default templates for the new statuses
INSERT INTO public.status_email_templates (status, subject, html_body, enabled) VALUES
('interview_scheduled', 'Interview Scheduled: {{role_applied}} | Vyntyra', '<p>Dear {{full_name}},</p><p>We are pleased to invite you for an interview for the <strong>{{role_applied}}</strong> position at Vyntyra Consultancy Services.</p><p><strong>Interviewer:</strong> {{interviewer}}</p><p><strong>Date & Time:</strong> {{meeting_time}}</p><p><strong>Meeting Link:</strong> <a href="{{meet_link}}">{{meet_link}}</a></p><p>Best regards,<br>Vyntyra Talent Acquisition</p>', true),
('finalised', 'Application Update: Finalised | Vyntyra', '<p>Dear {{full_name}},</p><p>We are happy to inform you that your application process for the <strong>{{role_applied}}</strong> position has been finalised.</p><p>We will share the final selection details and onboarding steps with you shortly.</p><p>Best regards,<br>Vyntyra Talent Acquisition</p>', true),
('selected', 'Congratulations! You are Selected | Vyntyra', '<p>Dear {{full_name}},</p><p>Congratulations! We are thrilled to inform you that you have been selected for the <strong>{{role_applied}}</strong> position at Vyntyra Consultancy Services.</p><p>We will send your formal offer letter and onboarding details shortly. Welcome to the team!</p><p>Best regards,<br>Vyntyra Talent Acquisition</p>', true)
ON CONFLICT (status) DO NOTHING;
