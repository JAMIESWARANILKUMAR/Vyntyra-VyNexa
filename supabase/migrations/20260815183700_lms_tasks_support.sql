-- 1. Extend tasks table with premium properties
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Beginner'; -- 'Beginner', 'Intermediate', 'Advanced'
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_doc_url TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS report_template_url TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS ppt_template_url TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS extended_due_date TIMESTAMPTZ;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS extension_reason TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS extension_status TEXT DEFAULT 'none'; -- 'none', 'requested', 'approved', 'rejected'
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_domain TEXT; -- 'tech', 'non_tech', 'management', 'all'

-- 2. Create LMS Progress Table
CREATE TABLE IF NOT EXISTS public.lms_progress (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source     TEXT        NOT NULL, -- 'Google', 'Microsoft', 'AWS', 'GeeksforGeeks'
  title      TEXT        NOT NULL,
  progress   INTEGER     DEFAULT 0,
  completed  BOOLEAN     DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, source, title)
);
ALTER TABLE public.lms_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own LMS progress" ON public.lms_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can write own LMS progress" ON public.lms_progress FOR ALL USING (auth.uid() = user_id);

-- 3. Create User Notifications Table (for in-app alerts)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL, -- 'info', 'task', 'meeting', 'leave', 'support'
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  metadata   JSONB       DEFAULT '{}',
  is_read    BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System insert notifications" ON public.user_notifications FOR INSERT WITH CHECK (true);

-- 4. Create Support Queries Table
CREATE TABLE IF NOT EXISTS public.support_queries (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id           UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject             TEXT        NOT NULL,
  description         TEXT        NOT NULL,
  category            TEXT        NOT NULL, -- 'Technical', 'LMS', 'Administrative', 'Payroll', 'Other'
  assigned_employee_id UUID       REFERENCES public.profiles(id) ON DELETE SET NULL,
  status              TEXT        DEFAULT 'pending_assignment', -- 'pending_assignment', 'assigned', 'in_progress', 'resolved'
  mentor_id           UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  meeting_id          UUID        REFERENCES public.meetings(id) ON DELETE SET NULL,
  meeting_status      TEXT        DEFAULT 'none', -- 'none', 'requested', 'approved', 'rejected'
  progress_notes      TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.support_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Interns can read own support queries" ON public.support_queries FOR SELECT USING (auth.uid() = intern_id);
CREATE POLICY "Interns can insert support queries" ON public.support_queries FOR INSERT WITH CHECK (auth.uid() = intern_id);
CREATE POLICY "Employees can read assigned support queries" ON public.support_queries FOR SELECT USING (auth.uid() = assigned_employee_id OR auth.uid() = mentor_id);
CREATE POLICY "Employees can update assigned support queries" ON public.support_queries FOR UPDATE USING (auth.uid() = assigned_employee_id OR auth.uid() = mentor_id);
CREATE POLICY "Admins can view and edit all support queries" ON public.support_queries FOR ALL TO authenticated USING (true);
