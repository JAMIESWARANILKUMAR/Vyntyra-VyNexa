-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Add referral_code_used to applications
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS referral_code_used TEXT;

-- Create an index to speed up referral queries
CREATE INDEX IF NOT EXISTS idx_applications_referral_code_used ON public.applications(referral_code_used);
