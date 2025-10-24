-- ====================================
-- プロフィール項目の拡張
-- ====================================

-- 1. usersテーブルのbioを100文字→200文字に拡張
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_bio_check;

ALTER TABLE users
  ADD CONSTRAINT users_bio_check
  CHECK (char_length(bio) <= 200);

-- 2. player_profilesテーブルに新しいカラムを追加
ALTER TABLE player_profiles
  ADD COLUMN main_location TEXT CHECK (char_length(main_location) <= 30),
  ADD COLUMN twitter_url TEXT,
  ADD COLUMN instagram_url TEXT,
  ADD COLUMN youtube_url TEXT,
  ADD COLUMN is_open_to_collab BOOLEAN DEFAULT false;

-- 3. 既存データへのデフォルト値設定
UPDATE player_profiles
  SET is_open_to_collab = false
  WHERE is_open_to_collab IS NULL;

-- 4. is_open_to_collabをNOT NULLに変更
ALTER TABLE player_profiles
  ALTER COLUMN is_open_to_collab SET DEFAULT false,
  ALTER COLUMN is_open_to_collab SET NOT NULL;
