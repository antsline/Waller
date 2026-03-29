-- ====================================
-- WALLER Database Schema v1.0
-- Migration 001: Create Tables
-- ====================================

-- ====================================
-- Custom Types
-- ====================================
CREATE TYPE clip_mood AS ENUM (
  'challenging',
  'landed',
  'training',
  'showcase',
  'first_time'
);

CREATE TYPE user_trick_status AS ENUM (
  'challenging',
  'landed'
);

CREATE TYPE trick_category AS ENUM (
  'flip',
  'twist',
  'combo',
  'original',
  'other'
);

-- ====================================
-- 1. users
-- ====================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (
    username ~ '^[a-z0-9_]{3,15}$'
  ),
  display_name TEXT NOT NULL CHECK (
    char_length(display_name) >= 1 AND char_length(display_name) <= 30
  ),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 200),
  hometown TEXT CHECK (char_length(hometown) <= 30),
  country_code TEXT CHECK (
    country_code IS NULL OR country_code ~ '^[A-Z]{2}$'
  ),
  facility_tag TEXT CHECK (char_length(facility_tag) <= 50),
  team TEXT CHECK (char_length(team) <= 50),
  locale TEXT NOT NULL DEFAULT 'ja' CHECK (locale IN ('ja', 'en')),
  username_change_count INTEGER NOT NULL DEFAULT 0 CHECK (username_change_count <= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_facility_tag ON users(facility_tag) WHERE facility_tag IS NOT NULL;
CREATE INDEX idx_users_country_code ON users(country_code) WHERE country_code IS NOT NULL;

-- ====================================
-- 2. tricks
-- ====================================
CREATE TABLE tricks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_original TEXT NOT NULL CHECK (char_length(name_original) >= 1),
  name_en TEXT,
  name_ja TEXT,
  aliases TEXT[],
  category trick_category NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  clip_count INTEGER NOT NULL DEFAULT 0 CHECK (clip_count >= 0),
  challenger_count INTEGER NOT NULL DEFAULT 0 CHECK (challenger_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tricks_name_original ON tricks(name_original);
CREATE INDEX idx_tricks_name_en ON tricks(name_en) WHERE name_en IS NOT NULL;
CREATE INDEX idx_tricks_name_ja ON tricks(name_ja) WHERE name_ja IS NOT NULL;
CREATE INDEX idx_tricks_category ON tricks(category);

-- ====================================
-- 3. clips
-- ====================================
CREATE TABLE clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_duration INTEGER NOT NULL CHECK (video_duration >= 1 AND video_duration <= 15),
  video_size BIGINT NOT NULL CHECK (video_size > 0 AND video_size <= 52428800), -- 50MB
  caption TEXT CHECK (char_length(caption) <= 200),
  mood clip_mood NOT NULL,
  facility_tag TEXT CHECK (char_length(facility_tag) <= 50),
  status TEXT NOT NULL DEFAULT 'published' CHECK (
    status IN ('published', 'deleted', 'reported')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clips_user_id ON clips(user_id);
CREATE INDEX idx_clips_created_at ON clips(created_at DESC);
CREATE INDEX idx_clips_status ON clips(status);
CREATE INDEX idx_clips_mood ON clips(mood) WHERE status = 'published';
CREATE INDEX idx_clips_facility_tag ON clips(facility_tag) WHERE facility_tag IS NOT NULL;

-- ====================================
-- 4. best_plays
-- ====================================
CREATE TABLE best_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_duration INTEGER NOT NULL CHECK (video_duration >= 1 AND video_duration <= 60),
  video_size BIGINT NOT NULL CHECK (video_size > 0 AND video_size <= 104857600), -- 100MB
  title TEXT CHECK (char_length(title) <= 50),
  mood clip_mood,
  facility_tag TEXT CHECK (char_length(facility_tag) <= 50),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0 AND sort_order <= 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_best_plays_user_id ON best_plays(user_id);
CREATE INDEX idx_best_plays_sort_order ON best_plays(user_id, sort_order);

-- ====================================
-- 5. best_play_tricks
-- ====================================
CREATE TABLE best_play_tricks (
  best_play_id UUID NOT NULL REFERENCES best_plays(id) ON DELETE CASCADE,
  trick_id UUID NOT NULL REFERENCES tricks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (best_play_id, trick_id)
);

CREATE INDEX idx_best_play_tricks_trick_id ON best_play_tricks(trick_id);

-- ====================================
-- 6. clip_tricks
-- ====================================
CREATE TABLE clip_tricks (
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  trick_id UUID NOT NULL REFERENCES tricks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (clip_id, trick_id)
);

CREATE INDEX idx_clip_tricks_trick_id ON clip_tricks(trick_id);
CREATE INDEX idx_clip_tricks_clip_id ON clip_tricks(clip_id);

-- ====================================
-- 7. user_tricks
-- ====================================
CREATE TABLE user_tricks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trick_id UUID NOT NULL REFERENCES tricks(id) ON DELETE CASCADE,
  status user_trick_status NOT NULL DEFAULT 'challenging',
  first_landed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, trick_id)
);

CREATE INDEX idx_user_tricks_user_id ON user_tricks(user_id);
CREATE INDEX idx_user_tricks_trick_id ON user_tricks(trick_id);
CREATE INDEX idx_user_tricks_status ON user_tricks(user_id, status);

-- ====================================
-- 8. claps
-- ====================================
CREATE TABLE claps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 1 AND count <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clip_id, user_id)
);

CREATE INDEX idx_claps_clip_id ON claps(clip_id);
CREATE INDEX idx_claps_user_id ON claps(user_id);

-- ====================================
-- 9. clip_counters
-- ====================================
CREATE TABLE clip_counters (
  clip_id UUID PRIMARY KEY REFERENCES clips(id) ON DELETE CASCADE,
  clap_count INTEGER NOT NULL DEFAULT 0 CHECK (clap_count >= 0),
  clap_total INTEGER NOT NULL DEFAULT 0 CHECK (clap_total >= 0),
  comment_count INTEGER NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================
-- 10. reports
-- ====================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('clip', 'comment')),
  target_id UUID NOT NULL,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (
    reason IN ('inappropriate', 'spam', 'harassment', 'impersonation', 'other')
  ),
  reason_detail TEXT CHECK (char_length(reason_detail) <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'resolved', 'dismissed')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(target_type, target_id, reporter_user_id)
);

CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reporter ON reports(reporter_user_id);

-- ====================================
-- 11. deletion_logs
-- ====================================
CREATE TABLE deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clip_id UUID NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deletion_logs_user_id ON deletion_logs(user_id);
CREATE INDEX idx_deletion_logs_deleted_at ON deletion_logs(user_id, deleted_at DESC);
