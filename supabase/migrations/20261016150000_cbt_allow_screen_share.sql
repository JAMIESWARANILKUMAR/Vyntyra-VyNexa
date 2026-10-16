-- ==============================================================================
-- VyNexa Connect: CBT External Screen Sharing Admin Control Migration
-- Target Database: Supabase (PostgreSQL)
-- ==============================================================================

ALTER TABLE public.cbt_exams 
ADD COLUMN IF NOT EXISTS allow_screen_share BOOLEAN DEFAULT false;
