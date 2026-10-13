-- ==============================================================================
-- Migration: Add exam_id column to cbt_questions & reload schema cache
-- Fixes: "Could not find the 'exam_id' column of 'cbt_questions' in the schema cache"
-- ==============================================================================

-- 1. Ensure cbt_questions table exists
CREATE TABLE IF NOT EXISTS public.cbt_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice',
    options JSONB,
    correct_answer TEXT,
    time_limit_seconds INTEGER DEFAULT 60,
    max_points INTEGER DEFAULT 10,
    order_index INTEGER DEFAULT 0
);

-- 2. Add exam_id and other essential columns if missing
ALTER TABLE public.cbt_questions 
ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS test_id TEXT,
ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS max_points INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 3. If cbt_questions was created with test_id, backfill exam_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'cbt_questions' AND column_name = 'test_id'
  ) THEN
    BEGIN
      UPDATE public.cbt_questions 
      SET exam_id = test_id::uuid 
      WHERE exam_id IS NULL AND test_id IS NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- 4. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
