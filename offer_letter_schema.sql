-- ==============================================================================
-- SQL SCHEMA: Offer Letter Management (Profiles & Applications)
-- ==============================================================================

-- 1. PROFILES TABLE SCHEMA (Relevant Columns)
-- This table stores the user profile and their cached offer letter URL.
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS offer_letter_url TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT;

-- 2. APPLICATIONS TABLE SCHEMA (Relevant Columns)
-- This table stores the internship application data, including domain tracking.
ALTER TABLE public.applications 
  ADD COLUMN IF NOT EXISTS offer_letter_url TEXT,
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS sub_domain TEXT;


-- ==============================================================================
-- SQL QUERY: Bulk Delete Offer Letters (Database ONLY)
-- ==============================================================================
-- WARNING: Running this will clear the URLs from the database, but it WILL NOT 
-- delete the actual PDF files stored in the Supabase Storage bucket. 
-- The "One-Click Delete" button in the admin portal handles both DB + Storage.

UPDATE public.profiles 
SET offer_letter_url = NULL, updated_at = NOW() 
WHERE role = 'intern' AND offer_letter_url IS NOT NULL;

UPDATE public.applications 
SET offer_letter_url = NULL, updated_at = NOW() 
WHERE offer_letter_url IS NOT NULL;

-- ==============================================================================
-- NOTE ON REGENERATION:
-- ==============================================================================
-- Generating PDF files cannot be done via pure SQL. The "Regenerate All" action 
-- relies on the Node.js/Cloudflare server runtime to use `jsPDF` and generate 
-- the actual binary files, which are then uploaded to Supabase Storage via the API.
