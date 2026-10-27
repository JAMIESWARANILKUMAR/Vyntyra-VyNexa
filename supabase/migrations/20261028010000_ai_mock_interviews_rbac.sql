-- ═══════════════════════════════════════════════════════════════════
-- RBAC Hierarchy & Multi-Tier Schemas for AI Mock Interviews
-- Supports: super_admin, admin, employee (mentor), candidate (user)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Create or extend user_role enum
DO $$ BEGIN
    CREATE TYPE public.mock_user_role AS ENUM ('super_admin', 'admin', 'employee', 'candidate');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure public.profiles table has role field
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'candidate';

-- 3. Update public.mock_sessions table for RBAC, scheduling, and mentor evaluation
ALTER TABLE IF EXISTS public.mock_sessions 
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS assigned_to UUID,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS schedule_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mentor_id UUID,
ADD COLUMN IF NOT EXISTS mentor_name TEXT,
ADD COLUMN IF NOT EXISTS mentor_notes TEXT,
ADD COLUMN IF NOT EXISTS mentor_grade NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Engineering',
ADD COLUMN IF NOT EXISTS is_observer_allowed BOOLEAN DEFAULT true;

-- Indexing for fast RBAC lookups
CREATE INDEX IF NOT EXISTS idx_mock_sessions_assigned_to ON public.mock_sessions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_created_by ON public.mock_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_mentor_id ON public.mock_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_scheduled_at ON public.mock_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_dept ON public.mock_sessions(department);

-- 4. RBAC Helper Functions in PostgreSQL
CREATE OR REPLACE FUNCTION public.get_user_interview_role(_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    _role TEXT;
BEGIN
    -- Check user_roles table first
    SELECT role::text INTO _role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
    IF _role IS NOT NULL THEN
        RETURN _role;
    END IF;

    -- Check profiles table
    SELECT role INTO _role FROM public.profiles WHERE id = _user_id LIMIT 1;
    IF _role IS NOT NULL THEN
        RETURN _role;
    END IF;

    -- Default fallback
    RETURN 'candidate';
END;
$$;

-- 5. Row Level Security Policies for Multi-Tier RBAC
-- Super Admins and Admins can see/manage all sessions
CREATE POLICY "Admins have full access to mock sessions"
ON public.mock_sessions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND (ur.role::text IN ('super_admin', 'admin'))
    ) OR
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND (p.role IN ('super_admin', 'admin'))
    )
);

-- Mentors/Employees can see and update sessions assigned to them or created by them
CREATE POLICY "Mentors can manage assigned mock sessions"
ON public.mock_sessions
FOR ALL
TO authenticated
USING (
    mentor_id = auth.uid() OR 
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.role = 'employee'
    )
);

-- Candidates can view their own sessions
CREATE POLICY "Candidates can view assigned mock sessions"
ON public.mock_sessions
FOR SELECT
TO authenticated
USING (
    assigned_to = auth.uid() OR 
    user_id = auth.uid()
);
