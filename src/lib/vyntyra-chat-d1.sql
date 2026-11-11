-- ===================================================================
-- VYNTYRA CHAT BETA - CLOUDFLARE D1 SQL SCHEMA
-- Cloudflare D1 SQLite database schema for real-time intern messaging,
-- AI content moderation audit logs, and presence telemetry.
-- ===================================================================

-- 1. Chat Rooms (1:1 Direct Messages, Public Channels, AI Copilot)
CREATE TABLE IF NOT EXISTS intern_chat_rooms (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'direct', -- 'direct' | 'channel' | 'ai'
    participant_ids TEXT NOT NULL,       -- JSON Array of User UUIDs e.g. ["user_1", "user_2"]
    title TEXT,                          -- Channel title or Custom Room Name
    last_message_text TEXT,              -- Preview snippet of the latest message
    last_message_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Chat Messages (Real-time Text, Images, Files, URLs, AI responses)
CREATE TABLE IF NOT EXISTS intern_chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_email TEXT,
    sender_avatar TEXT,
    receiver_id TEXT,                    -- Nullable for public/broadcast channels
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text', -- 'text' | 'image' | 'file' | 'url' | 'ai'
    file_url TEXT,                       -- Cloudflare R2 / S3 file URL if an attachment was sent
    file_name TEXT,                      -- Original file name
    file_size INTEGER,                   -- File size in bytes
    is_flagged INTEGER DEFAULT 0,        -- 1 if flagged by AI moderation
    flag_reason TEXT,                    -- Policy reason (e.g. profanity, nudity, harassment)
    is_deleted INTEGER DEFAULT 0,        -- Soft delete flag
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(room_id) REFERENCES intern_chat_rooms(id) ON DELETE CASCADE
);

-- 3. AI Content Moderation & Compliance Audit Logs (Accessed by Super Admin)
CREATE TABLE IF NOT EXISTS intern_chat_moderation_logs (
    id TEXT PRIMARY KEY,
    message_id TEXT,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_email TEXT,
    blocked_content TEXT NOT NULL,
    violation_type TEXT NOT NULL,        -- 'nudity_or_sexual_content' | 'profanity_or_inappropriate_language' | etc.
    ai_confidence REAL DEFAULT 0.95,     -- Confidence score from 0.0 to 1.0
    action_taken TEXT NOT NULL DEFAULT 'blocked_before_delivery',
    timestamp TEXT DEFAULT (datetime('now'))
);

-- 4. Intern Presence & Real-Time Typing Indicators (Last Seen, Status)
CREATE TABLE IF NOT EXISTS intern_chat_presence (
    user_id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    last_seen TEXT DEFAULT (datetime('now')),
    is_online INTEGER DEFAULT 1,         -- 1 for online, 0 for offline
    typing_in_room TEXT,                 -- Room ID where the user is actively typing, or NULL
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================================================================
-- PERFORMANCE INDEXES (Optimized for Sub-millisecond D1 Edge Queries)
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created 
    ON intern_chat_messages(room_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender 
    ON intern_chat_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver 
    ON intern_chat_messages(receiver_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_flagged 
    ON intern_chat_messages(is_flagged);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message 
    ON intern_chat_rooms(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_type 
    ON intern_chat_rooms(type);

CREATE INDEX IF NOT EXISTS idx_chat_mod_logs_sender 
    ON intern_chat_moderation_logs(sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_mod_logs_timestamp 
    ON intern_chat_moderation_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_chat_presence_updated 
    ON intern_chat_presence(updated_at DESC);
