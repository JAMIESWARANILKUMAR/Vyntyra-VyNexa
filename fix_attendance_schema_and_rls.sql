-- ====================================================================
-- VYNTYRA CONNECT: ATTENDANCE & TIMECARD SCHEMAS & PERMISSIVE RLS
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Ensure Attendance Table Exists with All Necessary Columns
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    status TEXT DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user_id column references auth.users(id) & profiles(id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_user_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.attendance 
        ADD CONSTRAINT attendance_user_id_profiles_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Create Optimized Indexes for Realtime & Performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance (user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance (date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance (user_id, date);

-- 3. Enable RLS and Grant Complete Permissions
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting or restrictive policies
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can update all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Service role full access on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all authenticated users read write attendance" ON public.attendance;
DROP POLICY IF EXISTS "Public full access to attendance" ON public.attendance;

-- Create Permissive Universal Policy for Authenticated & Service Roles
CREATE POLICY "Public full access to attendance"
ON public.attendance
FOR ALL
TO authenticated, service_role, anon
USING (true)
WITH CHECK (true);

-- Explicitly Grant Database Access Grants
GRANT ALL ON TABLE public.attendance TO authenticated;
GRANT ALL ON TABLE public.attendance TO service_role;
GRANT ALL ON TABLE public.attendance TO anon;

-- Enable Realtime Replication on Attendance Table
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;

-- ====================================================================
-- 4. Ensure Leave Requests Table Exists & Has RLS Access
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access to leave_requests" ON public.leave_requests;
CREATE POLICY "Public full access to leave_requests"
ON public.leave_requests
FOR ALL
TO authenticated, service_role, anon
USING (true)
WITH CHECK (true);

GRANT ALL ON TABLE public.leave_requests TO authenticated;
GRANT ALL ON TABLE public.leave_requests TO service_role;
GRANT ALL ON TABLE public.leave_requests TO anon;

-- ====================================================================
-- 5. Ensure Payouts Table Exists & Has RLS Access
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT DEFAULT 'Salary',
    status TEXT DEFAULT 'paid',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access to payouts" ON public.payouts;
CREATE POLICY "Public full access to payouts"
ON public.payouts
FOR ALL
TO authenticated, service_role, anon
USING (true)
WITH CHECK (true);

GRANT ALL ON TABLE public.payouts TO authenticated;
GRANT ALL ON TABLE public.payouts TO service_role;
GRANT ALL ON TABLE public.payouts TO anon;
