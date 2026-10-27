-- ═══════════════════════════════════════════════════════════════════
-- AI-Powered 1:1 Live Mock Interview Schema
-- Tables: mock_sessions, interview_transcripts
-- Compatible with Supabase PostgreSQL and Cloudflare D1
-- ═══════════════════════════════════════════════════════════════════

-- 1. Mock Sessions Table
CREATE TABLE IF NOT EXISTS public.mock_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT,
    intern_id TEXT,
    domain TEXT NOT NULL DEFAULT 'fullstack',
    target_role TEXT NOT NULL DEFAULT 'Full-Stack Software Engineer',
    difficulty TEXT NOT NULL DEFAULT 'mid', -- 'junior' | 'mid' | 'senior'
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'in_progress' | 'completed' | 'abandoned'
    
    -- Scoring & Telemetry Metrics
    overall_score NUMERIC(5,2) DEFAULT NULL, -- 0 to 100
    technical_score NUMERIC(5,2) DEFAULT NULL,
    communication_score NUMERIC(5,2) DEFAULT NULL,
    behavioral_score NUMERIC(5,2) DEFAULT NULL,
    fluency_wpm INTEGER DEFAULT 0,
    filler_words_count INTEGER DEFAULT 0,
    eye_contact_percent NUMERIC(5,2) DEFAULT 0.0,
    head_stability_percent NUMERIC(5,2) DEFAULT 0.0,
    
    -- Question Bank & Active State
    questions_bank JSONB DEFAULT '[]'::jsonb,
    current_question_index INTEGER DEFAULT 0,
    code_snippet TEXT DEFAULT '',
    code_language TEXT DEFAULT 'javascript',
    
    -- Comprehensive Evaluation Report (Generated via OpenRouter)
    evaluation_report JSONB DEFAULT NULL,
    hiring_verdict TEXT DEFAULT NULL, -- 'Strong Hire' | 'Hire' | 'Leaning Hire' | 'Needs Practice' | 'No Hire'
    
    -- Cloudflare R2 / Object Storage Artifacts
    recording_r2_url TEXT DEFAULT NULL,
    report_r2_url TEXT DEFAULT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Interview Transcripts Table (Turn-by-turn Speech & Conversation)
CREATE TABLE IF NOT EXISTS public.interview_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.mock_sessions(id) ON DELETE CASCADE,
    speaker TEXT NOT NULL, -- 'ai' | 'candidate'
    message TEXT NOT NULL,
    turn_index INTEGER NOT NULL DEFAULT 0,
    timestamp_ms BIGINT NOT NULL DEFAULT 0,
    wpm INTEGER DEFAULT NULL,
    filler_words JSONB DEFAULT '[]'::jsonb,
    audio_url TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_mock_sessions_user_id ON public.mock_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_status ON public.mock_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_created_at ON public.mock_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_transcripts_session_id ON public.interview_transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_transcripts_turn_index ON public.interview_transcripts(session_id, turn_index);

-- Enable Row Level Security (RLS)
ALTER TABLE public.mock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_transcripts ENABLE ROW LEVEL SECURITY;

-- Allow public / candidate reading & writing for active mock sessions (with service role full access)
CREATE POLICY "Public candidates can create mock sessions" 
    ON public.mock_sessions FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Public candidates can view own mock sessions" 
    ON public.mock_sessions FOR SELECT 
    USING (true);

CREATE POLICY "Public candidates can update own mock sessions" 
    ON public.mock_sessions FOR UPDATE 
    USING (true);

CREATE POLICY "Public candidates can insert interview transcripts" 
    ON public.interview_transcripts FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Public candidates can view interview transcripts" 
    ON public.interview_transcripts FOR SELECT 
    USING (true);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mock_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_mock_sessions_timestamp ON public.mock_sessions;
CREATE TRIGGER trigger_update_mock_sessions_timestamp
BEFORE UPDATE ON public.mock_sessions
FOR EACH ROW
EXECUTE FUNCTION update_mock_sessions_timestamp();
