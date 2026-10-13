-- Migration: Add enterprise CBT controls, camera strictness levels, questions max_points, and RLS policies

-- 1. Ensure cbt_questions has max_points
ALTER TABLE public.cbt_questions 
ADD COLUMN IF NOT EXISTS max_points INTEGER DEFAULT 10;

-- 2. Ensure cbt_exams has all enterprise controls
ALTER TABLE public.cbt_exams 
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS enable_camera BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS camera_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS camera_strictness TEXT DEFAULT 'standard', -- lenient, standard, strict
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_instant_results BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;

-- 3. Safely convert team_ids and intern_ids only if they are ARRAY (e.g. UUID[]), leaving jsonb intact
DO $$
DECLARE
  team_type text;
  intern_type text;
BEGIN
  SELECT data_type INTO team_type 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'cbt_exams' AND column_name = 'team_ids';

  SELECT data_type INTO intern_type 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'cbt_exams' AND column_name = 'intern_ids';

  -- Only alter if currently typed as a postgres ARRAY (e.g. UUID[])
  IF team_type = 'ARRAY' THEN
    BEGIN
      ALTER TABLE public.cbt_exams ALTER COLUMN team_ids TYPE TEXT[] USING team_ids::TEXT[];
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  IF intern_type = 'ARRAY' THEN
    BEGIN
      ALTER TABLE public.cbt_exams ALTER COLUMN intern_ids TYPE TEXT[] USING intern_ids::TEXT[];
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- 4. Submissions tracking enhancements
ALTER TABLE public.cbt_submissions
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_retake BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS results_released BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS camera_strictness TEXT DEFAULT 'standard';

-- 5. RLS Policies for cbt_exams and cbt_questions (Allow authenticated users and service role full CRUD)
DROP POLICY IF EXISTS "Allow authenticated users to insert exams" ON public.cbt_exams;
CREATE POLICY "Allow authenticated users to insert exams" ON public.cbt_exams FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update exams" ON public.cbt_exams;
CREATE POLICY "Allow authenticated users to update exams" ON public.cbt_exams FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete exams" ON public.cbt_exams;
CREATE POLICY "Allow authenticated users to delete exams" ON public.cbt_exams FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert questions" ON public.cbt_questions;
CREATE POLICY "Allow authenticated users to insert questions" ON public.cbt_questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update questions" ON public.cbt_questions;
CREATE POLICY "Allow authenticated users to update questions" ON public.cbt_questions FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete questions" ON public.cbt_questions;
CREATE POLICY "Allow authenticated users to delete questions" ON public.cbt_questions FOR DELETE USING (auth.role() = 'authenticated');

-- Submissions management policies
DROP POLICY IF EXISTS "Allow admins to update submissions" ON public.cbt_submissions;
CREATE POLICY "Allow admins to update submissions" ON public.cbt_submissions FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admins to delete submissions" ON public.cbt_submissions;
CREATE POLICY "Allow admins to delete submissions" ON public.cbt_submissions FOR DELETE USING (auth.role() = 'authenticated');
