CREATE TABLE IF NOT EXISTS posts (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, title_en TEXT NOT NULL DEFAULT '',
 body TEXT NOT NULL, body_en TEXT NOT NULL DEFAULT '',
 category TEXT NOT NULL CHECK(category IN ('thoughts','perspectives','finds')),
 status TEXT NOT NULL CHECK(status IN ('draft','published')),
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS posts_public ON posts(status, created_at DESC);
CREATE TABLE IF NOT EXISTS comments (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, body TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','hidden')),
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS comments_public ON comments(status,created_at DESC);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, admin_hash TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS notifications (
 comment_id TEXT PRIMARY KEY REFERENCES comments(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed')),
 attempts INTEGER NOT NULL DEFAULT 0, next_attempt INTEGER NOT NULL, last_error TEXT,
 locked_until INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS notifications_due ON notifications(status,next_attempt);
