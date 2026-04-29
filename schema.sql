-- D1 Database Schema for 找谁玩 (Who To Play With)

-- Users table: stores authenticated user profiles
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL,
  provider_user_id TEXT,
  created_at INTEGER NOT NULL
);

-- Friends table: stores friend's details per user
CREATE TABLE IF NOT EXISTS friends (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  phone TEXT DEFAULT '',
  birthday TEXT DEFAULT '',
  location TEXT DEFAULT '',
  how_we_met TEXT DEFAULT '',
  important_events TEXT DEFAULT '[]',
  values TEXT DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Hangouts table: stores hangout records per user
CREATE TABLE IF NOT EXISTS hangouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  quality INTEGER NOT NULL,
  duration TEXT DEFAULT '',
  date TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Hangout Friends junction table: many-to-many relationship
CREATE TABLE IF NOT EXISTS hangout_friends (
  hangout_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  PRIMARY KEY (hangout_id, friend_id),
  FOREIGN KEY (hangout_id) REFERENCES hangouts(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES friends(id) ON DELETE CASCADE
);

-- Auth tokens table: for magic link tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_hangouts_user_id ON hangouts(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(auth_provider, provider_user_id);
