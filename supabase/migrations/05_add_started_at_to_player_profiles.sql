-- ====================================
-- 経験年数を自動計算するために started_at カラムを追加
-- ====================================

-- 既存のカラムを削除
ALTER TABLE player_profiles
  DROP COLUMN IF EXISTS experience_years,
  DROP COLUMN IF EXISTS experience_months;

-- 開始年月カラムを追加
ALTER TABLE player_profiles
  ADD COLUMN started_at DATE NOT NULL DEFAULT '2024-01-01';

-- コメント追加
COMMENT ON COLUMN player_profiles.started_at IS 'ウォールトランポリンを始めた年月（日は1日で固定）';
