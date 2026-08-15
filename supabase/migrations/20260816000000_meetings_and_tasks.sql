-- 20260816000000_meetings_and_tasks.sql

-- 1. Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  meeting_url text,
  scheduled_at timestamp with time zone NOT NULL,
  target_role text DEFAULT 'all',
  target_user_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create task_templates table
CREATE TABLE IF NOT EXISTS public.task_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  task_file_url text,
  priority text DEFAULT 'medium',
  domain text DEFAULT 'all',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Policies for meetings
CREATE POLICY "Meetings are viewable by everyone" 
  ON public.meetings FOR SELECT USING (true);

CREATE POLICY "Meetings can be created/updated by admins" 
  ON public.meetings FOR ALL USING (
    (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'super_admin')))
  );

-- Policies for task_templates
CREATE POLICY "Task templates are viewable by everyone" 
  ON public.task_templates FOR SELECT USING (true);

CREATE POLICY "Task templates can be managed by admins" 
  ON public.task_templates FOR ALL USING (
    (auth.uid() IN (SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'super_admin')))
  );
