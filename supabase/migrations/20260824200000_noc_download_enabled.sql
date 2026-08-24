-- Add noc_download_enabled to profiles and applications tables
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS noc_download_enabled boolean DEFAULT false;

ALTER TABLE IF EXISTS public.applications
ADD COLUMN IF NOT EXISTS noc_download_enabled boolean DEFAULT false;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_noc_download_enabled ON public.profiles(noc_download_enabled);
CREATE INDEX IF NOT EXISTS idx_applications_noc_download_enabled ON public.applications(noc_download_enabled);
