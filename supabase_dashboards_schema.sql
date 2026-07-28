-- Multi-Role Dashboards Schema Extension
-- Run this in your Supabase SQL Editor

-- 1. Create User Profiles Table
-- This table stores public profile information for employees and interns
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('employee', 'intern', 'admin')),
    department TEXT,
    position TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles (so they can see team members)
CREATE POLICY "Allow authenticated to read profiles" ON public.user_profiles
    FOR SELECT TO authenticated USING (true);

-- Allow admins to insert/update/delete
CREATE POLICY "Allow admins to manage profiles" ON public.user_profiles
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );

-- 2. Create Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT, -- 'employee', 'intern', or NULL for everyone
    posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can read announcements
CREATE POLICY "Allow authenticated to read announcements" ON public.announcements
    FOR SELECT TO authenticated USING (true);

-- Only admins can manage announcements
CREATE POLICY "Allow admins to manage announcements" ON public.announcements
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
        )
    );

-- 3. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Users can read their own tasks, admins can read all tasks
CREATE POLICY "Allow users to read their tasks" ON public.tasks
    FOR SELECT TO authenticated USING (
        assigned_to = auth.uid() OR
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

-- Users can update their own tasks (e.g. status)
CREATE POLICY "Allow users to update their tasks" ON public.tasks
    FOR UPDATE TO authenticated USING (
        assigned_to = auth.uid() OR
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

-- Admins can insert/delete tasks
CREATE POLICY "Allow admins to manage tasks" ON public.tasks
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

-- 4. Create Schedules Table
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_time TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Everyone can read schedules
CREATE POLICY "Allow authenticated to read schedules" ON public.schedules
    FOR SELECT TO authenticated USING (true);

-- Only admins can manage schedules
CREATE POLICY "Allow admins to manage schedules" ON public.schedules
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

-- 5. Create Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out TIMESTAMPTZ,
    status TEXT DEFAULT 'present',
    UNIQUE(user_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Users can read their own attendance, admins can read all
CREATE POLICY "Allow users to read their attendance" ON public.attendance
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

-- Users can insert/update their own attendance
CREATE POLICY "Allow users to manage their attendance" ON public.attendance
    FOR ALL TO authenticated USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );
