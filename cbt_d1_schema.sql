-- ==============================================================================
-- VyNexa Connect: Full Cloudflare D1 (SQLite) CBT Schema
-- Target: Cloudflare D1
-- ==============================================================================

-- 1. CBT EXAMS / TESTS
CREATE TABLE IF NOT EXISTS cbt_exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General',
    passing_score INTEGER DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    status TEXT DEFAULT 'published',
    allocation_mode TEXT DEFAULT 'individual',
    team_ids TEXT DEFAULT '[]',
    intern_ids TEXT DEFAULT '[]',
    time_limit_minutes INTEGER DEFAULT 30,
    enable_camera INTEGER DEFAULT 1,
    camera_required INTEGER DEFAULT 1,
    camera_strictness TEXT DEFAULT 'standard',
    deadline DATETIME,
    shuffle_questions INTEGER DEFAULT 0,
    show_instant_results INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 1,
    pdf_url TEXT,
    csv_url TEXT
);

-- Legacy cbt_tests table alias for backward compatibility
CREATE TABLE IF NOT EXISTS cbt_tests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    target_type TEXT,
    target_id TEXT,
    modules TEXT,
    time_limit_minutes INTEGER NOT NULL DEFAULT 30,
    passing_score INTEGER DEFAULT 60,
    status TEXT DEFAULT 'published',
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. CBT QUESTIONS (Supports both exam_id and test_id)
CREATE TABLE IF NOT EXISTS cbt_questions (
    id TEXT PRIMARY KEY,
    exam_id TEXT,
    test_id TEXT,
    question_type TEXT NOT NULL DEFAULT 'multiple_choice',
    question_text TEXT NOT NULL,
    options TEXT,
    correct_answer TEXT,
    explanation TEXT,
    reference_code TEXT,
    test_cases TEXT,
    time_limit_seconds INTEGER DEFAULT 60,
    max_points INTEGER DEFAULT 10,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. CBT SUBMISSIONS
CREATE TABLE IF NOT EXISTS cbt_submissions (
    id TEXT PRIMARY KEY,
    exam_id TEXT,
    test_id TEXT,
    intern_id TEXT NOT NULL,
    answers TEXT,
    proctoring_logs TEXT,
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    passed INTEGER DEFAULT 0,
    ai_feedback TEXT,
    status TEXT DEFAULT 'submitted',
    attempt_number INTEGER DEFAULT 1,
    is_retake INTEGER DEFAULT 0,
    results_released INTEGER DEFAULT 1,
    camera_strictness TEXT DEFAULT 'standard',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. CBT ANSWERS
CREATE TABLE IF NOT EXISTS cbt_answers (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    selected_option TEXT,
    subjective_answer TEXT,
    ai_score INTEGER,
    ai_feedback TEXT,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. CBT MALPRACTICE LOGS
CREATE TABLE IF NOT EXISTS cbt_malpractice_logs (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    infraction_type TEXT NOT NULL,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_d1_cbt_questions_exam_id ON cbt_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_d1_cbt_questions_test_id ON cbt_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_d1_cbt_submissions_exam_id ON cbt_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_d1_cbt_answers_submission_id ON cbt_answers(submission_id);
