-- 20261025000000_meet_enterprise_telemetry_and_roles.sql
-- Enterprise Role-Based Access Control (RBAC), Visitor Gatekeeper Logs, 
-- and Attendance Telemetry for Vyntyra Meet.

-- 1. Meeting Roles (Super Admin, Host, Co-Host, Participant)
CREATE TABLE IF NOT EXISTS public.meet_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id text NOT NULL,
  user_email text NOT NULL,
  role text NOT NULL DEFAULT 'participant',
  assigned_by text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT meet_roles_unique_meeting_user UNIQUE (meeting_id, user_email)
);

ALTER TABLE public.meet_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meet_roles viewable by all" ON public.meet_roles FOR SELECT USING (true);
CREATE POLICY "meet_roles editable by authenticated" ON public.meet_roles FOR ALL TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meet_roles TO anon, authenticated, service_role;

-- 2. Visitor & Guest Gatekeeper Logs
CREATE TABLE IF NOT EXISTS public.meet_visitor_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  organization text,
  intern_id text,
  is_verified boolean DEFAULT false,
  user_type text DEFAULT 'guest',
  status text DEFAULT 'admitted',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.meet_visitor_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meet_visitor_logs viewable by all" ON public.meet_visitor_logs FOR SELECT USING (true);
CREATE POLICY "meet_visitor_logs insertable by all" ON public.meet_visitor_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "meet_visitor_logs updatable by authenticated" ON public.meet_visitor_logs FOR UPDATE USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meet_visitor_logs TO anon, authenticated, service_role;

-- 3. Detailed Meeting Attendance & Connection Telemetry
CREATE TABLE IF NOT EXISTS public.meet_attendance_telemetry (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id text NOT NULL,
  participant_id text NOT NULL,
  user_email text,
  user_name text NOT NULL,
  phone text,
  intern_id text,
  user_type text DEFAULT 'guest',
  join_time timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  leave_time timestamp with time zone,
  duration_seconds integer DEFAULT 0,
  reconnection_count integer DEFAULT 1,
  attendance_status text DEFAULT 'Present',
  device_metadata text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT meet_attendance_unique_session UNIQUE (meeting_id, participant_id)
);

ALTER TABLE public.meet_attendance_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meet_attendance_telemetry viewable by all" ON public.meet_attendance_telemetry FOR SELECT USING (true);
CREATE POLICY "meet_attendance_telemetry insertable by all" ON public.meet_attendance_telemetry FOR INSERT WITH CHECK (true);
CREATE POLICY "meet_attendance_telemetry updatable by all" ON public.meet_attendance_telemetry FOR UPDATE USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meet_attendance_telemetry TO anon, authenticated, service_role;
