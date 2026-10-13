-- ==============================================================================
-- Cloudflare D1 (SQLite) Migration: Fix "no such column: exam_id"
-- Target: Cloudflare D1 Console or `wrangler d1 execute <DB_NAME> --file=...`
-- ==============================================================================

-- 1. Add the missing exam_id column to cbt_questions
ALTER TABLE cbt_questions ADD COLUMN exam_id TEXT;

-- 2. Backfill exam_id from test_id for existing records
UPDATE cbt_questions SET exam_id = test_id WHERE exam_id IS NULL;

-- 3. Ensure test_id and extra question parameters exist
ALTER TABLE cbt_questions ADD COLUMN test_id TEXT;
ALTER TABLE cbt_questions ADD COLUMN explanation TEXT;
ALTER TABLE cbt_questions ADD COLUMN reference_code TEXT;
ALTER TABLE cbt_questions ADD COLUMN test_cases TEXT;
ALTER TABLE cbt_questions ADD COLUMN time_limit_seconds INTEGER DEFAULT 60;
ALTER TABLE cbt_questions ADD COLUMN order_index INTEGER DEFAULT 0;

-- 4. Ensure cbt_submissions has exam_id column
ALTER TABLE cbt_submissions ADD COLUMN exam_id TEXT;
UPDATE cbt_submissions SET exam_id = test_id WHERE exam_id IS NULL;

-- 5. Safe Indexes (now that exam_id column is guaranteed to exist)
CREATE INDEX IF NOT EXISTS idx_d1_cbt_questions_exam_id ON cbt_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_d1_cbt_questions_test_id ON cbt_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_d1_cbt_submissions_exam_id ON cbt_submissions(exam_id);
