-- ==============================================================================
-- VyNexa Connect: Complete CBT & Enterprise Assessments Schema
-- Target Database: Supabase (PostgreSQL)
-- Fully Idempotent: Safe to run multiple times
-- ==============================================================================

-- 1. CBT EXAMS TABLE
CREATE TABLE IF NOT EXISTS public.cbt_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    passing_score INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'published',
    allocation_mode TEXT DEFAULT 'individual',
    team_ids TEXT[] DEFAULT '{}',
    intern_ids TEXT[] DEFAULT '{}',
    time_limit_minutes INTEGER DEFAULT 30,
    enable_camera BOOLEAN DEFAULT true,
    camera_required BOOLEAN DEFAULT true,
    camera_strictness TEXT DEFAULT 'standard',
    deadline TIMESTAMP WITH TIME ZONE,
    shuffle_questions BOOLEAN DEFAULT false,
    show_instant_results BOOLEAN DEFAULT true,
    max_attempts INTEGER DEFAULT 1,
    pdf_url TEXT,
    csv_url TEXT
);

ALTER TABLE public.cbt_exams 
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS enable_camera BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS camera_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS camera_strictness TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_instant_results BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS csv_url TEXT;

-- 2. CBT QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.cbt_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    test_id TEXT,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice',
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    reference_code TEXT,
    test_cases JSONB,
    time_limit_seconds INTEGER DEFAULT 60,
    max_points INTEGER DEFAULT 10,
    order_index INTEGER DEFAULT 0
);

ALTER TABLE public.cbt_questions 
ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS test_id TEXT,
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS reference_code TEXT,
ADD COLUMN IF NOT EXISTS test_cases JSONB,
ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS max_points INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 3. CBT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.cbt_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    test_id TEXT,
    intern_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    total_score INTEGER DEFAULT 0,
    ai_feedback TEXT,
    malpractice_warnings INTEGER DEFAULT 0,
    attempt_number INTEGER DEFAULT 1,
    is_retake BOOLEAN DEFAULT false,
    results_released BOOLEAN DEFAULT true,
    camera_strictness TEXT DEFAULT 'standard'
);

ALTER TABLE public.cbt_submissions
ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS test_id TEXT,
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_retake BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS results_released BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS camera_strictness TEXT DEFAULT 'standard';

-- 4. CBT ANSWERS TABLE
CREATE TABLE IF NOT EXISTS public.cbt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.cbt_submissions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.cbt_questions(id) ON DELETE CASCADE,
    selected_option TEXT,
    subjective_answer TEXT,
    ai_score INTEGER,
    ai_feedback TEXT,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CBT MALPRACTICE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.cbt_malpractice_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.cbt_submissions(id) ON DELETE CASCADE,
    infraction_type TEXT NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. SAFE DYNAMIC BACKFILL
DO $$
BEGIN
  BEGIN
    EXECUTE 'UPDATE public.cbt_questions SET exam_id = test_id::uuid WHERE exam_id IS NULL AND test_id IS NOT NULL';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    EXECUTE 'UPDATE public.cbt_submissions SET exam_id = test_id::uuid WHERE exam_id IS NULL AND test_id IS NOT NULL';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_cbt_questions_exam_id ON public.cbt_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_submissions_exam_intern ON public.cbt_submissions(exam_id, intern_id);
CREATE INDEX IF NOT EXISTS idx_cbt_answers_submission_id ON public.cbt_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_cbt_malpractice_submission_id ON public.cbt_malpractice_logs(submission_id);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_malpractice_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read exams" ON public.cbt_exams;
CREATE POLICY "Allow authenticated users to read exams" ON public.cbt_exams FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage exams" ON public.cbt_exams;
CREATE POLICY "Allow authenticated users to manage exams" ON public.cbt_exams FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to read questions" ON public.cbt_questions;
CREATE POLICY "Allow authenticated users to read questions" ON public.cbt_questions FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage questions" ON public.cbt_questions;
CREATE POLICY "Allow authenticated users to manage questions" ON public.cbt_questions FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage submissions" ON public.cbt_submissions;
CREATE POLICY "Allow authenticated users to manage submissions" ON public.cbt_submissions FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage answers" ON public.cbt_answers;
CREATE POLICY "Allow authenticated users to manage answers" ON public.cbt_answers FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage malpractice logs" ON public.cbt_malpractice_logs;
CREATE POLICY "Allow authenticated users to manage malpractice logs" ON public.cbt_malpractice_logs FOR ALL USING (auth.role() = 'authenticated');

-- 9. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
