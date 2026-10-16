-- ==============================================================================
-- VyNexa Connect: CBT Proctoring Modes & Keyboard Control Migration
-- Target Database: Supabase (PostgreSQL)
-- ==============================================================================

ALTER TABLE public.cbt_exams 
ADD COLUMN IF NOT EXISTS proctoring_mode TEXT DEFAULT 'camera_malpractice',
ADD COLUMN IF NOT EXISTS allow_ctrl_keys BOOLEAN DEFAULT false;
