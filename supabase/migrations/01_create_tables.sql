-- ====================================
-- Waller Database Schema
-- Migration 01: Create Tables
-- ====================================

-- ====================================
-- 1. users テーブル
-- ====================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('player', 'fan')),
  username TEXT UNIQUE NOT NULL CHECK (
    username ~ '^[a-z0-9_]{3,15}$'
  ),
  display_name TEXT NOT NULL CHECK (
    char_length(display_name) >= 1 AND char_length(display_name) <= 30
  ),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 100),
  username_change_count INTEGER NOT NULL DEFAULT 0 CHECK (username_change_count <= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- インデックス
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);

-- ====================================
-- 2. player_profiles テーブル
-- ====================================
CREATE TABLE player_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
  experience_months INTEGER NOT NULL CHECK (experience_months >= 0 AND experience_months < 12),
  skill_level INTEGER NOT NULL CHECK (skill_level >= 1 AND skill_level <= 5),
  team_name TEXT CHECK (char_length(team_name) <= 50),
  home_gym TEXT CHECK (char_length(home_gym) <= 50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================
-- 3. posts テーブル
-- ====================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_duration INTEGER NOT NULL CHECK (video_duration >= 3 AND video_duration <= 60),
  video_size BIGINT NOT NULL CHECK (video_size <= 104857600), -- 100MB
  caption TEXT CHECK (char_length(caption) <= 200),
  category_tag TEXT CHECK (
    category_tag IN ('challenge', 'success', 'practice', 'combo', 'new', 'other')
  ),
  status TEXT NOT NULL DEFAULT 'published' CHECK (
    status IN ('published', 'deleted', 'reported')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_category_tag ON posts(category_tag) WHERE status = 'published';

-- ====================================
-- 4. likes テーブル
-- ====================================
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- インデックス
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_user_created ON likes(user_id, created_at DESC);

-- ====================================
-- 5. reactions テーブル
-- ====================================
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (
    reaction_type IN ('fire', 'clap', 'sparkle', 'muscle')
  ),
  previous_type TEXT CHECK (
    previous_type IN ('fire', 'clap', 'sparkle', 'muscle')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- インデックス
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);

-- ====================================
-- 6. post_counters テーブル（非正規化）
-- ====================================
CREATE TABLE post_counters (
  post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  like_count INTEGER NOT NULL DEFAULT 0,
  reaction_fire_count INTEGER NOT NULL DEFAULT 0,
  reaction_clap_count INTEGER NOT NULL DEFAULT 0,
  reaction_sparkle_count INTEGER NOT NULL DEFAULT 0,
  reaction_muscle_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================
-- 7. reports テーブル
-- ====================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (
    reason IN ('inappropriate', 'spam', 'harassment', 'impersonation', 'other')
  ),
  reason_detail TEXT CHECK (char_length(reason_detail) <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'resolved', 'dismissed')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, reporter_user_id)
);

-- インデックス
CREATE INDEX idx_reports_post_id ON reports(post_id);
CREATE INDEX idx_reports_status ON reports(status);

-- ====================================
-- 8. deletion_logs テーブル
-- ====================================
CREATE TABLE deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_deletion_logs_user_deleted ON deletion_logs(user_id, deleted_at);
