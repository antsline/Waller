-- ====================================
-- WALLER Database Schema v1.0
-- Migration 002: Create Triggers and Functions
-- ====================================

-- ====================================
-- 1. updated_at auto-update trigger
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tricks_updated_at
  BEFORE UPDATE ON tricks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clips_updated_at
  BEFORE UPDATE ON clips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_best_plays_updated_at
  BEFORE UPDATE ON best_plays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tricks_updated_at
  BEFORE UPDATE ON user_tricks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claps_updated_at
  BEFORE UPDATE ON claps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clip_counters_updated_at
  BEFORE UPDATE ON clip_counters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- 2. clip_counters auto-init on clips INSERT
-- ====================================
CREATE OR REPLACE FUNCTION initialize_clip_counters()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO clip_counters (clip_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_clip_counters
  AFTER INSERT ON clips
  FOR EACH ROW
  EXECUTE FUNCTION initialize_clip_counters();

-- ====================================
-- 3. clap counter update on claps INSERT/UPDATE/DELETE
-- ====================================
CREATE OR REPLACE FUNCTION update_clap_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clip_counters
    SET clap_count = clap_count + 1,
        clap_total = clap_total + NEW.count
    WHERE clip_id = NEW.clip_id;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE clip_counters
    SET clap_total = clap_total + (NEW.count - OLD.count)
    WHERE clip_id = NEW.clip_id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clip_counters
    SET clap_count = GREATEST(clap_count - 1, 0),
        clap_total = GREATEST(clap_total - OLD.count, 0)
    WHERE clip_id = OLD.clip_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clap_counters
  AFTER INSERT OR UPDATE OR DELETE ON claps
  FOR EACH ROW
  EXECUTE FUNCTION update_clap_counters();

-- ====================================
-- 4. Auto-hide clip on 3 reports
-- ====================================
CREATE OR REPLACE FUNCTION auto_hide_reported_clip()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  IF NEW.target_type <> 'clip' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO report_count
  FROM reports
  WHERE target_type = 'clip'
    AND target_id = NEW.target_id
    AND status = 'pending';

  IF report_count >= 3 THEN
    UPDATE clips
    SET status = 'reported'
    WHERE id = NEW.target_id
      AND status = 'published';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_hide_reported_clip
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION auto_hide_reported_clip();

-- ====================================
-- 5. user_tricks auto-update on clip_tricks INSERT
--    CRITICAL: 'landed' must NEVER downgrade to 'challenging'
-- ====================================
CREATE OR REPLACE FUNCTION update_user_tricks_from_clip()
RETURNS TRIGGER AS $$
DECLARE
  v_clip_user_id UUID;
  v_clip_mood clip_mood;
  v_new_status user_trick_status;
  v_existing_status user_trick_status;
BEGIN
  -- Get the clip's user_id and mood
  SELECT user_id, mood INTO v_clip_user_id, v_clip_mood
  FROM clips
  WHERE id = NEW.clip_id;

  IF v_clip_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine the status based on mood
  IF v_clip_mood IN ('landed', 'showcase') THEN
    v_new_status := 'landed';
  ELSE
    -- challenging, training, first_time
    v_new_status := 'challenging';
  END IF;

  -- Check existing status to prevent downgrade
  SELECT status INTO v_existing_status
  FROM user_tricks
  WHERE user_id = v_clip_user_id AND trick_id = NEW.trick_id;

  IF v_existing_status IS NOT NULL THEN
    -- Row exists: only update if not downgrading from landed
    IF v_existing_status = 'landed' AND v_new_status = 'challenging' THEN
      -- NEVER downgrade landed to challenging
      RETURN NEW;
    END IF;

    UPDATE user_tricks
    SET status = v_new_status,
        first_landed_at = CASE
          WHEN v_new_status = 'landed' AND first_landed_at IS NULL THEN NOW()
          ELSE first_landed_at
        END
    WHERE user_id = v_clip_user_id AND trick_id = NEW.trick_id;
  ELSE
    -- New row: insert
    INSERT INTO user_tricks (user_id, trick_id, status, first_landed_at)
    VALUES (
      v_clip_user_id,
      NEW.trick_id,
      v_new_status,
      CASE WHEN v_new_status = 'landed' THEN NOW() ELSE NULL END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_tricks_from_clip
  AFTER INSERT ON clip_tricks
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tricks_from_clip();

-- ====================================
-- 6. Trick counts update
--    Update tricks.clip_count when clip_tricks change
--    Update tricks.challenger_count when user_tricks change
-- ====================================

-- 6a. clip_count: updated on clip_tricks INSERT/DELETE
CREATE OR REPLACE FUNCTION update_trick_clip_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tricks
    SET clip_count = clip_count + 1
    WHERE id = NEW.trick_id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tricks
    SET clip_count = GREATEST(clip_count - 1, 0)
    WHERE id = OLD.trick_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trick_clip_count
  AFTER INSERT OR DELETE ON clip_tricks
  FOR EACH ROW
  EXECUTE FUNCTION update_trick_clip_count();

-- 6b. challenger_count: updated on user_tricks INSERT/DELETE/UPDATE
CREATE OR REPLACE FUNCTION update_trick_challenger_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tricks
    SET challenger_count = challenger_count + 1
    WHERE id = NEW.trick_id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tricks
    SET challenger_count = GREATEST(challenger_count - 1, 0)
    WHERE id = OLD.trick_id;
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    -- No change to challenger_count on status update (still same user-trick pair)
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trick_challenger_count
  AFTER INSERT OR DELETE OR UPDATE ON user_tricks
  FOR EACH ROW
  EXECUTE FUNCTION update_trick_challenger_count();
