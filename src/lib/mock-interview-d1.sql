-- ═══════════════════════════════════════════════════════════════════
-- Cloudflare D1 Compatible SQLite Schema for AI Mock Interviews
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mock_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT,
    intern_id TEXT,
    domain TEXT NOT NULL DEFAULT 'fullstack',
    target_role TEXT NOT NULL DEFAULT 'Full-Stack Software Engineer',
    difficulty TEXT NOT NULL DEFAULT 'mid',
    status TEXT NOT NULL DEFAULT 'scheduled',
    overall_score REAL,
    technical_score REAL,
    communication_score REAL,
    behavioral_score REAL,
    fluency_wpm INTEGER DEFAULT 0,
    filler_words_count INTEGER DEFAULT 0,
    eye_contact_percent REAL DEFAULT 0.0,
    head_stability_percent REAL DEFAULT 0.0,
    questions_bank TEXT DEFAULT '[]',
    current_question_index INTEGER DEFAULT 0,
    code_snippet TEXT DEFAULT '',
    code_language TEXT DEFAULT 'javascript',
    evaluation_report TEXT,
    hiring_verdict TEXT,
    recording_r2_url TEXT,
    report_r2_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interview_transcripts (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    speaker TEXT NOT NULL,
    message TEXT NOT NULL,
    turn_index INTEGER NOT NULL DEFAULT 0,
    timestamp_ms INTEGER NOT NULL DEFAULT 0,
    wpm INTEGER,
    filler_words TEXT DEFAULT '[]',
    audio_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(session_id) REFERENCES mock_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_d1_mock_sessions_user_id ON mock_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_d1_mock_sessions_created_at ON mock_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_d1_interview_transcripts_session_id ON interview_transcripts(session_id);
