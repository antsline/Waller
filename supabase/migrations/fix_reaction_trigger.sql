-- ====================================
-- リアクション更新トリガーの修正
-- ====================================
-- 問題: UPDATE時に同じカラムに複数回代入していた
-- 修正: 1つの式で減算と加算を同時に行う

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
    -- 種類変更: 1つの式で減算と加算を同時に行う
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
