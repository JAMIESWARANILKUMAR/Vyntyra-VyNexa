-- =========================================================================
-- COMPLETE PRODUCTION SQL SCHEMA FOR DASHBOARD & MODULE PERMISSIONS
-- Run this script in the Supabase SQL Editor: Dashboard > SQL Editor > New Query
-- =========================================================================

-- 1. Create the dashboard_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_type TEXT NOT NULL CHECK (portal_type IN ('intern', 'employee')),
    module_name TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Add columns if table already existed without them
ALTER TABLE public.dashboard_settings ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.dashboard_settings ADD COLUMN IF NOT EXISTS portal_type TEXT;
ALTER TABLE public.dashboard_settings ADD COLUMN IF NOT EXISTS module_name TEXT;
ALTER TABLE public.dashboard_settings ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.dashboard_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.dashboard_settings ADD COLUMN IF NOT EXISTS updated_by UUID;

-- 3. Clean up duplicates and ensure UNIQUE constraint on (portal_type, module_name)
DO $$
BEGIN
    -- Delete older duplicates keeping the highest id / newest updated
    DELETE FROM public.dashboard_settings a
    USING public.dashboard_settings b
    WHERE a.id < b.id 
      AND a.portal_type = b.portal_type 
      AND a.module_name = b.module_name;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_portal_module'
    ) THEN
        ALTER TABLE public.dashboard_settings 
        ADD CONSTRAINT unique_portal_module UNIQUE (portal_type, module_name);
    END IF;
END $$;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

-- 5. Drop old conflicting policies if they exist
DROP POLICY IF EXISTS "Anyone can view dashboard settings" ON public.dashboard_settings;
DROP POLICY IF EXISTS "Allow authenticated to view dashboard settings" ON public.dashboard_settings;
DROP POLICY IF EXISTS "Allow public read dashboard settings" ON public.dashboard_settings;
DROP POLICY IF EXISTS "Admins can insert dashboard settings" ON public.dashboard_settings;
DROP POLICY IF EXISTS "Admins can update dashboard settings" ON public.dashboard_settings;
DROP POLICY IF EXISTS "Admins can delete dashboard settings" ON public.dashboard_settings;
DROP POLICY IF EXISTS "Allow admins to manage dashboard settings" ON public.dashboard_settings;
DROP POLICY IF EXISTS "Allow management of dashboard settings" ON public.dashboard_settings;

-- 6. Re-create robust policies:
-- All users (authenticated and anon) can read module permissions
CREATE POLICY "Allow public read dashboard settings"
ON public.dashboard_settings FOR SELECT
USING (true);

-- Allow authenticated users and service_role full management access
CREATE POLICY "Allow management of dashboard settings"
ON public.dashboard_settings FOR ALL
USING (true)
WITH CHECK (true);

-- 7. Grant permissions across roles
GRANT ALL ON public.dashboard_settings TO service_role;
GRANT ALL ON public.dashboard_settings TO authenticated;
GRANT SELECT ON public.dashboard_settings TO anon;

-- 8. Seed all Intern and Employee Portal Modules
INSERT INTO public.dashboard_settings (portal_type, module_name, is_enabled) VALUES
-- Intern Portal Modules
('intern', 'overview', true),
('intern', 'tasks', true),
('intern', 'kanban', true),
('intern', 'deliverables', true),
('intern', 'standups', true),
('intern', 'attendance', true),
('intern', 'meetings', true),
('intern', 'resources', true),
('intern', 'onboarding', true),
('intern', 'lms', true),
('intern', 'ppo', true),
('intern', 'leaves', true),
('intern', 'support', true),
('intern', 'refer', true),
('intern', 'cbt', true),
('intern', 'mock_interview', true),
('intern', 'ambassador', true),
('intern', 'notes', true),
('intern', 'feedback', true),

-- Employee Portal Modules
('employee', 'tasks', true),
('employee', 'attendance', true),
('employee', 'leave', true),
('employee', 'payouts', true),
('employee', 'banking', true),
('employee', 'support', true),
('employee', 'resolver_support', true),
('employee', 'meetings', true),
('employee', 'interviews', true),
('employee', 'my_interns', true),
('employee', 'campaigns', true),
('employee', 'dataset-vault', true),
('employee', 'announcements', true),
('employee', 'team', true),
('employee', 'resources', true),
('employee', 'locker', true),
('employee', 'contact', true),
('employee', 'security', true),
('employee', 'refer', true)
ON CONFLICT (portal_type, module_name) 
DO UPDATE SET updated_at = now();
