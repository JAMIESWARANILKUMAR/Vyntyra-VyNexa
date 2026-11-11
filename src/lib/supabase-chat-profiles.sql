-- ==============================================================================
-- VYNTYRA CHAT: SUPABASE PROFILES DIRECTORY SCHEMA (PostgreSQL)
-- ==============================================================================
-- This schema operates SOLELY inside Supabase (Postgres) and DOES NOT affect,
-- overwrite, or alter any Cloudflare D1 chat messaging tables.
-- ==============================================================================

-- 1. Safely add any missing profile directory columns
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS intern_id TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Technology & Engineering',
  ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'Software Engineering Intern',
  ADD COLUMN IF NOT EXISTS college_name TEXT DEFAULT 'Computer Science & Engineering',
  ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 6,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'intern',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT 'Intern Associate',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Populate missing intern IDs for existing profile rows
UPDATE public.profiles
SET intern_id = 'VYN-INT-' || UPPER(SUBSTRING(id::text, 1, 6))
WHERE intern_id IS NULL OR intern_id = '';

-- 3. Set default role to 'intern' if role is not set
UPDATE public.profiles
SET role = 'intern'
WHERE role IS NULL OR role = '';

-- 4. Speed up intern search and directory lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_intern_id ON public.profiles(intern_id);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- 5. Enable RLS and add directory read policy without using DROP
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Public can view profiles for directory'
  ) THEN
    CREATE POLICY "Public can view profiles for directory"
    ON public.profiles FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- 6. Safely enrich existing signed-up profiles from applications by email (FK-safe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
    UPDATE public.profiles p
    SET 
      department = COALESCE(p.department, a.role_applied, 'Technology & Engineering'),
      position = COALESCE(p.position, a.position, 'Software Engineering Intern'),
      college_name = COALESCE(p.college_name, a.company, 'Computer Science & Engineering')
    FROM public.applications a
    WHERE LOWER(p.email) = LOWER(a.email);
  END IF;
END $$;
