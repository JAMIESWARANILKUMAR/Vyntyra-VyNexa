-- ==============================================================================
-- VYNTYRA CHAT: SUPABASE PROFILES DIRECTORY SCHEMA (PostgreSQL)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Intern Associate',
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'intern',
  intern_id TEXT,
  department TEXT DEFAULT 'Technology & Engineering',
  position TEXT DEFAULT 'Software Engineering Intern',
  college_name TEXT DEFAULT 'Computer Science & Engineering',
  duration_months INTEGER DEFAULT 6,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS intern_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Technology & Engineering';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'Software Engineering Intern';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_name TEXT DEFAULT 'Computer Science & Engineering';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 6;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'intern';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT 'Intern Associate';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE public.profiles
SET intern_id = 'VYN-INT-' || UPPER(SUBSTRING(id::text, 1, 6))
WHERE intern_id IS NULL OR intern_id = '';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_intern_id ON public.profiles(intern_id);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view profiles for directory" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated read safe intern profiles for chat" ON public.profiles;

CREATE POLICY "Public can view profiles for directory"
ON public.profiles FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role full profiles management" ON public.profiles;
CREATE POLICY "Service role full profiles management"
ON public.profiles
TO service_role
USING (true)
WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
    INSERT INTO public.profiles (id, full_name, email, role, intern_id, department, position, college_name, duration_months, created_at, updated_at)
    SELECT 
      a.id,
      COALESCE(a.full_name, 'Intern Associate'),
      a.email,
      'intern',
      'VYN-INT-' || UPPER(SUBSTRING(a.id::text, 1, 6)),
      COALESCE(a.role_applied, 'Software Development'),
      COALESCE(a.position, 'Software Engineering Intern'),
      COALESCE(a.company, 'Computer Science & Engineering'),
      6,
      COALESCE(a.created_at, now()),
      COALESCE(a.updated_at, now())
    FROM public.applications a
    WHERE a.email IS NOT NULL AND a.email <> ''
    ON CONFLICT (id) DO UPDATE 
    SET 
      full_name = EXCLUDED.full_name,
      role = COALESCE(public.profiles.role, 'intern'),
      department = COALESCE(public.profiles.department, EXCLUDED.department),
      position = COALESCE(public.profiles.position, EXCLUDED.position);
  END IF;
END $$;
