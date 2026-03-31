-- ====================================
-- WALLER Database Schema v1.0
-- Migration 005: Create RPC Functions
-- ====================================
-- Resolves Sprint 6 security carryover:
--   S1 (CRITICAL): TOCTOU race in clip deletion
--   S4 (HIGH): Non-transactional clip_tricks replacement
--   S5 (MEDIUM): Orphan clip_tricks on deletion
--   S7 (MEDIUM): Client clock dependency for free window

-- ====================================
-- 1. check_and_delete_clip
-- ====================================
-- Atomically verifies ownership, checks free window / daily limit,
-- soft-deletes clip, logs deletion, and cleans up clip_tricks.
-- Returns JSON: { status: 'deleted' | 'error', code?: string, trick_ids?: uuid[] }
CREATE OR REPLACE FUNCTION check_and_delete_clip(p_clip_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_clip RECORD;
  v_clip_age_minutes DOUBLE PRECISION;
  v_daily_count INTEGER;
  v_trick_ids UUID[];
  v_mood TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'not_authenticated');
  END IF;

  -- Lock the clip row to prevent concurrent modification
  SELECT id, user_id, created_at, mood
  INTO v_clip
  FROM clips
  WHERE id = p_clip_id
    AND status = 'published'
  FOR UPDATE;

  IF v_clip IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'clip_not_found');
  END IF;

  IF v_clip.user_id <> v_user_id THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'not_owner');
  END IF;

  -- Collect trick_ids before deletion
  SELECT COALESCE(array_agg(trick_id), ARRAY[]::UUID[])
  INTO v_trick_ids
  FROM clip_tricks
  WHERE clip_id = p_clip_id;

  v_mood := v_clip.mood::TEXT;

  -- Calculate clip age using server time (resolves S7)
  v_clip_age_minutes := EXTRACT(EPOCH FROM (NOW() - v_clip.created_at)) / 60.0;

  -- Check daily deletion limit if outside free window
  IF v_clip_age_minutes > 10 THEN
    SELECT COUNT(*)
    INTO v_daily_count
    FROM deletion_logs
    WHERE user_id = v_user_id
      AND deleted_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC')
    FOR UPDATE;

    IF v_daily_count >= 3 THEN
      RETURN jsonb_build_object('status', 'error', 'code', 'delete_limit_reached');
    END IF;
  END IF;

  -- Soft-delete the clip
  UPDATE clips
  SET status = 'deleted', updated_at = NOW()
  WHERE id = p_clip_id;

  -- Log the deletion
  INSERT INTO deletion_logs (user_id, clip_id)
  VALUES (v_user_id, p_clip_id);

  -- Clean up clip_tricks (resolves S5)
  DELETE FROM clip_tricks
  WHERE clip_id = p_clip_id;

  RETURN jsonb_build_object(
    'status', 'deleted',
    'trick_ids', to_jsonb(v_trick_ids),
    'mood', v_mood
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_delete_clip(UUID) TO authenticated;

-- ====================================
-- 2. replace_clip_tricks
-- ====================================
-- Atomically replaces clip_tricks for a clip (resolves S4).
-- Verifies ownership before modification.
-- Returns JSON: { status: 'replaced' | 'error', code?: string }
CREATE OR REPLACE FUNCTION replace_clip_tricks(
  p_clip_id UUID,
  p_trick_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_clip_owner UUID;
  v_trick_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'not_authenticated');
  END IF;

  -- Validate array size
  IF array_length(p_trick_ids, 1) IS NOT NULL AND array_length(p_trick_ids, 1) > 20 THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'too_many_tricks');
  END IF;

  -- Verify clip ownership
  SELECT user_id
  INTO v_clip_owner
  FROM clips
  WHERE id = p_clip_id
    AND status = 'published'
  FOR UPDATE;

  IF v_clip_owner IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'clip_not_found');
  END IF;

  IF v_clip_owner <> v_user_id THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'not_owner');
  END IF;

  -- Delete existing clip_tricks
  DELETE FROM clip_tricks
  WHERE clip_id = p_clip_id;

  -- Insert new clip_tricks
  IF array_length(p_trick_ids, 1) IS NOT NULL THEN
    FOREACH v_trick_id IN ARRAY p_trick_ids
    LOOP
      INSERT INTO clip_tricks (clip_id, trick_id)
      VALUES (p_clip_id, v_trick_id);
    END LOOP;
  END IF;

  RETURN jsonb_build_object('status', 'replaced');
END;
$$;

GRANT EXECUTE ON FUNCTION replace_clip_tricks(UUID, UUID[]) TO authenticated;

-- ====================================
-- 3. delete_account
-- ====================================
-- Soft-deletes the authenticated user's own account.
-- Uses auth.uid() to ensure server-side ownership validation.
-- Returns JSON: { status: 'deleted' | 'error', code?: string }
CREATE OR REPLACE FUNCTION delete_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'not_authenticated');
  END IF;

  UPDATE users
  SET status = 'deleted', updated_at = NOW()
  WHERE id = v_user_id
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'account_not_found');
  END IF;

  -- Cascade: soft-delete all user clips
  UPDATE clips
  SET status = 'deleted', updated_at = NOW()
  WHERE user_id = v_user_id
    AND status = 'published';

  -- Cascade: clean up clip_tricks for deleted clips
  DELETE FROM clip_tricks
  WHERE clip_id IN (
    SELECT id FROM clips WHERE user_id = v_user_id
  );

  -- Cascade: remove best plays and their trick associations
  DELETE FROM best_play_tricks
  WHERE best_play_id IN (
    SELECT id FROM best_plays WHERE user_id = v_user_id
  );
  DELETE FROM best_plays WHERE user_id = v_user_id;

  RETURN jsonb_build_object('status', 'deleted');
END;
$$;

GRANT EXECUTE ON FUNCTION delete_account() TO authenticated;
