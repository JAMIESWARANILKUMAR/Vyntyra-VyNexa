-- Create CBT Exam Tables

CREATE TABLE public.cbt_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    passing_score INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'draft', -- draft, published, closed
    allocation_mode TEXT DEFAULT 'individual', -- individual, team
    team_ids UUID[] DEFAULT '{}', -- array of team IDs if allocated to teams
    intern_ids UUID[] DEFAULT '{}' -- array of intern IDs if allocated to individuals
);

CREATE TABLE public.cbt_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice', -- multiple_choice, subjective
    options JSONB, -- { "A": "...", "B": "..." }
    correct_answer TEXT, -- "A" or text for subjective AI grading reference
    time_limit_seconds INTEGER DEFAULT 60, -- Manual question-level timer
    order_index INTEGER DEFAULT 0
);

CREATE TABLE public.cbt_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    intern_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'in_progress', -- in_progress, submitted, terminated
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    total_score INTEGER DEFAULT 0,
    ai_feedback TEXT,
    malpractice_warnings INTEGER DEFAULT 0
);

CREATE TABLE public.cbt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.cbt_submissions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.cbt_questions(id) ON DELETE CASCADE,
    selected_option TEXT,
    subjective_answer TEXT,
    ai_score INTEGER,
    ai_feedback TEXT,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.cbt_malpractice_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.cbt_submissions(id) ON DELETE CASCADE,
    infraction_type TEXT, -- e.g., 'tab_switch', 'face_not_detected'
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RBAC policies
ALTER TABLE public.cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_malpractice_logs ENABLE ROW LEVEL SECURITY;

-- Expose to authenticated users (admin checks will be in RLS or server fns)
CREATE POLICY "Allow all authenticated users to read exams" ON public.cbt_exams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users to read questions" ON public.cbt_questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow interns to insert submissions" ON public.cbt_submissions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow interns to read their own submissions" ON public.cbt_submissions FOR SELECT USING (auth.uid() = intern_id);
CREATE POLICY "Allow admins to read all submissions" ON public.cbt_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin'))
);

