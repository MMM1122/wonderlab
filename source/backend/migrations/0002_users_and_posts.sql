CREATE TABLE users (
 id TEXT PRIMARY KEY,
 email TEXT UNIQUE COLLATE NOCASE,
 display_name TEXT NOT NULL,
 bio TEXT NOT NULL DEFAULT '',
 role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','owner')),
 verified_at INTEGER,
 created_at INTEGER NOT NULL
);
INSERT INTO users(id,email,display_name,role,created_at) VALUES('site-owner',NULL,'Wonder Lab','owner',0);
ALTER TABLE posts ADD COLUMN user_id TEXT NOT NULL DEFAULT 'site-owner';
ALTER TABLE posts ADD COLUMN slug TEXT;
ALTER TABLE posts ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
UPDATE posts SET slug='post-' || id WHERE slug IS NULL;
CREATE UNIQUE INDEX posts_slug ON posts(slug);
CREATE INDEX posts_by_user ON posts(user_id,updated_at DESC);
CREATE TABLE login_challenges (
 id TEXT PRIMARY KEY, email TEXT NOT NULL, code_hash TEXT NOT NULL,
 expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
 consumed_at INTEGER, created_at INTEGER NOT NULL
);
CREATE INDEX challenges_expiry ON login_challenges(expires_at);
CREATE TABLE user_sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX user_sessions_expiry ON user_sessions(expires_at);

CREATE TRIGGER posts_author_insert BEFORE INSERT ON posts WHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id) BEGIN SELECT RAISE(ABORT,'Unknown author'); END;
CREATE TRIGGER posts_author_update BEFORE UPDATE OF user_id ON posts WHEN NOT EXISTS (SELECT 1 FROM users WHERE id=NEW.user_id) BEGIN SELECT RAISE(ABORT,'Unknown author'); END;
