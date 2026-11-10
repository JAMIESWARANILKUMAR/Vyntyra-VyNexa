-- Vyntyra Chat Beta D1 Database Schema
-- Dedicated Cloudflare D1 storage for Intern Chat, Moderation & Audit Logs

CREATE TABLE IF NOT EXISTS intern_chat_rooms (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'direct', -- 'direct' or 'channel'
    participant_ids TEXT NOT NULL, -- JSON array of user_ids e.g. '["id1","id2"]'
    title TEXT,
    last_message_text TEXT,
    last_message_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS intern_chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_email TEXT,
    sender_avatar TEXT,
    receiver_id TEXT, -- Target user for 1-on-1 DMs
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'file', 'url', 'ai'
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    is_flagged INTEGER DEFAULT 0,
    flag_reason TEXT,
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS intern_chat_moderation_logs (
    id TEXT PRIMARY KEY,
    message_id TEXT,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_email TEXT,
    blocked_content TEXT NOT NULL,
    violation_type TEXT NOT NULL, -- 'nudity', 'sexual', 'inappropriate', 'profanity', 'harassment'
    ai_confidence REAL DEFAULT 0.95,
    action_taken TEXT NOT NULL DEFAULT 'blocked_before_delivery',
    timestamp TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS intern_chat_presence (
    user_id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    last_seen TEXT DEFAULT (datetime('now')),
    is_online INTEGER DEFAULT 1,
    typing_in_room TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Index optimizations for high-speed real-time polling and lookup
CREATE INDEX IF NOT EXISTS idx_chat_msg_room ON intern_chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_msg_sender ON intern_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_receiver ON intern_chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_mod_time ON intern_chat_moderation_logs(timestamp);
