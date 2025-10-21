-- ====================================
-- カウンター更新問題の完全修正
-- Migration 08: Fix Counters Completely
-- ====================================

-- 問題1: RLSがトリガーによるpost_counters更新をブロックしている
-- 問題2: UPDATE時の重複カラム代入エラー

-- ====================================
-- Step 1: post_countersのRLSポリシーを追加
-- ====================================

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Service role can insert post counters" ON post_counters;
DROP POLICY IF EXISTS "Service role can update post counters" ON post_counters;
DROP POLICY IF EXISTS "Authenticated users can trigger counter updates" ON post_counters;

-- トリガー関数がpost_countersを更新できるようにする
-- サービスロール（トリガー）による挿入を許可
CREATE POLICY "Service role can insert post counters"
  ON post_counters FOR INSERT
  TO service_role
  WITH CHECK (true);

-- サービスロール（トリガー）による更新を許可
CREATE POLICY "Service role can update post counters"
  ON post_counters FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 認証されたユーザー（トリガー実行時の権限）による更新を許可
CREATE POLICY "Authenticated users can trigger counter updates"
  ON post_counters FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ====================================
-- Step 2: トリガー関数を修正（重複代入エラー対策）
-- ====================================

-- いいねカウンター更新関数（変更なし、念のため再作成）
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER
SECURITY DEFINER -- トリガーを所有者権限で実行（RLSをバイパス）
AS $$
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

-- リアクションカウンター更新関数（重複代入エラー修正版）
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER
SECURITY DEFINER -- トリガーを所有者権限で実行（RLSをバイパス）
AS $$
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
    -- 種類変更: 1つの式で減算と加算を同時に行う（修正版）
    UPDATE post_counters
    SET
      reaction_fire_count = reaction_fire_count
        - CASE WHEN OLD.reaction_type = 'fire' THEN 1 ELSE 0 END
        + CASE WHEN NEW.reaction_type = 'fire' THEN 1 ELSE 0 END,
      reaction_clap_count = reaction_clap_count
        - CASE WHEN OLD.reaction_type = 'clap' THEN 1 ELSE 0 END
        + CASE WHEN NEW.reaction_type = 'clap' THEN 1 ELSE 0 END,
      reaction_sparkle_count = reaction_sparkle_count
        - CASE WHEN OLD.reaction_type = 'sparkle' THEN 1 ELSE 0 END
        + CASE WHEN NEW.reaction_type = 'sparkle' THEN 1 ELSE 0 END,
      reaction_muscle_count = reaction_muscle_count
        - CASE WHEN OLD.reaction_type = 'muscle' THEN 1 ELSE 0 END
        + CASE WHEN NEW.reaction_type = 'muscle' THEN 1 ELSE 0 END,
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

-- ====================================
-- Step 3: 既存データの修正（カウントを正しい値に更新）
-- ====================================

-- post_countersの値を実際のデータに基づいて修正
UPDATE post_counters pc
SET
  reaction_fire_count = (SELECT COUNT(*) FROM reactions WHERE post_id = pc.post_id AND reaction_type = 'fire'),
  reaction_clap_count = (SELECT COUNT(*) FROM reactions WHERE post_id = pc.post_id AND reaction_type = 'clap'),
  reaction_sparkle_count = (SELECT COUNT(*) FROM reactions WHERE post_id = pc.post_id AND reaction_type = 'sparkle'),
  reaction_muscle_count = (SELECT COUNT(*) FROM reactions WHERE post_id = pc.post_id AND reaction_type = 'muscle'),
  like_count = (SELECT COUNT(*) FROM likes WHERE post_id = pc.post_id),
  updated_at = NOW();

-- ====================================
-- 完了メッセージ
-- ====================================

DO $$
BEGIN
  RAISE NOTICE '✅ カウンター更新の修正が完了しました';
  RAISE NOTICE '  - RLSポリシーを追加';
  RAISE NOTICE '  - トリガー関数をSECURITY DEFINERで再作成';
  RAISE NOTICE '  - 既存データを修正';
END $$;
