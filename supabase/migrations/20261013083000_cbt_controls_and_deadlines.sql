-- Migration: Add CBT Exam controls, time limits, camera configuration, and deadlines
ALTER TABLE public.cbt_exams 
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS enable_camera BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS camera_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
