CREATE TABLE IF NOT EXISTS intern_chat_rooms (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'direct',
    participant_ids TEXT NOT NULL,
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
    receiver_id TEXT,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text',
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    is_flagged INTEGER DEFAULT 0,
    flag_reason TEXT,
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(room_id) REFERENCES intern_chat_rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS intern_chat_moderation_logs (
    id TEXT PRIMARY KEY,
    message_id TEXT,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_email TEXT,
    blocked_content TEXT NOT NULL,
    violation_type TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON intern_chat_messages(room_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON intern_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON intern_chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_flagged ON intern_chat_messages(is_flagged);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message ON intern_chat_rooms(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON intern_chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_mod_logs_sender ON intern_chat_moderation_logs(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_mod_logs_timestamp ON intern_chat_moderation_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_presence_updated ON intern_chat_presence(updated_at DESC);
