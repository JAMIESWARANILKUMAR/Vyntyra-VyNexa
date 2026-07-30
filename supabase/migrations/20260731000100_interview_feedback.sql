-- Add interview feedback columns to applications table
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS interviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS interview_summary TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS interview_remarks TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS interview_feedback_submitted_at TIMESTAMP WITH TIME ZONE;
