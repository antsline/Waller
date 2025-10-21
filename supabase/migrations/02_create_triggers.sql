-- ====================================
-- Waller Database Schema
-- Migration 02: Create Triggers and Functions
-- ====================================

-- ====================================
-- 更新日時の自動更新トリガー
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users テーブル
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- player_profiles テーブル
CREATE TRIGGER update_player_profiles_updated_at
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- posts テーブル
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- reactions テーブル
CREATE TRIGGER update_reactions_updated_at
  BEFORE UPDATE ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- post_counters 自動初期化トリガー
-- ====================================
CREATE OR REPLACE FUNCTION initialize_post_counters()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO post_counters (post_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_post_counters
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION initialize_post_counters();

-- ====================================
-- いいね数カウンター更新トリガー
-- ====================================
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_counters
    SET like_count = like_count + 1,
        updated_at = NOW()
    WHERE post_id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_counters
    SET like_count = like_count - 1,
        updated_at = NOW()
    WHERE post_id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_like_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_like_count();

-- ====================================
-- リアクション数カウンター更新トリガー
-- ====================================
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 新規追加
    UPDATE post_counters
    SET
      reaction_fire_count = reaction_fire_count + CASE WHEN NEW.reaction_type = 'fire' THEN 1 ELSE 0 END,
      reaction_clap_count = reaction_clap_count + CASE WHEN NEW.reaction_type = 'clap' THEN 1 ELSE 0 END,
      reaction_sparkle_count = reaction_sparkle_count + CASE WHEN NEW.reaction_type = 'sparkle' THEN 1 ELSE 0 END,
      reaction_muscle_count = reaction_muscle_count + CASE WHEN NEW.reaction_type = 'muscle' THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE post_id = NEW.post_id;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- 種類変更
    UPDATE post_counters
    SET
      -- 古いタイプを減算
      reaction_fire_count = reaction_fire_count - CASE WHEN OLD.reaction_type = 'fire' THEN 1 ELSE 0 END,
      reaction_clap_count = reaction_clap_count - CASE WHEN OLD.reaction_type = 'clap' THEN 1 ELSE 0 END,
      reaction_sparkle_count = reaction_sparkle_count - CASE WHEN OLD.reaction_type = 'sparkle' THEN 1 ELSE 0 END,
      reaction_muscle_count = reaction_muscle_count - CASE WHEN OLD.reaction_type = 'muscle' THEN 1 ELSE 0 END,
      -- 新しいタイプを加算
      reaction_fire_count = reaction_fire_count + CASE WHEN NEW.reaction_type = 'fire' THEN 1 ELSE 0 END,
      reaction_clap_count = reaction_clap_count + CASE WHEN NEW.reaction_type = 'clap' THEN 1 ELSE 0 END,
      reaction_sparkle_count = reaction_sparkle_count + CASE WHEN NEW.reaction_type = 'sparkle' THEN 1 ELSE 0 END,
      reaction_muscle_count = reaction_muscle_count + CASE WHEN NEW.reaction_type = 'muscle' THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE post_id = NEW.post_id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- 削除
    UPDATE post_counters
    SET
      reaction_fire_count = reaction_fire_count - CASE WHEN OLD.reaction_type = 'fire' THEN 1 ELSE 0 END,
      reaction_clap_count = reaction_clap_count - CASE WHEN OLD.reaction_type = 'clap' THEN 1 ELSE 0 END,
      reaction_sparkle_count = reaction_sparkle_count - CASE WHEN OLD.reaction_type = 'sparkle' THEN 1 ELSE 0 END,
      reaction_muscle_count = reaction_muscle_count - CASE WHEN OLD.reaction_type = 'muscle' THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE post_id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reaction_count
  AFTER INSERT OR UPDATE OR DELETE ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_reaction_count();

-- ====================================
-- 通報による自動非表示トリガー
-- ====================================
CREATE OR REPLACE FUNCTION auto_hide_reported_posts()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- 該当投稿の通報数をカウント
  SELECT COUNT(*) INTO report_count
  FROM reports
  WHERE post_id = NEW.post_id AND status = 'pending';

  -- 3件以上なら自動非表示
  IF report_count >= 3 THEN
    UPDATE posts
    SET status = 'reported'
    WHERE id = NEW.post_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_hide_reported_posts
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION auto_hide_reported_posts();
