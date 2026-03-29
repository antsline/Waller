-- ====================================
-- WALLER Database Schema v1.0
-- Migration 003: Row Level Security Policies
-- ====================================

-- ====================================
-- Enable RLS on all tables
-- ====================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tricks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_play_tricks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_tricks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tricks ENABLE ROW LEVEL SECURITY;
ALTER TABLE claps ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_logs ENABLE ROW LEVEL SECURITY;

-- ====================================
-- users: public read (active only), owner insert/update
-- ====================================
CREATE POLICY "users_select_public"
  ON users FOR SELECT
  USING (status = 'active');

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ====================================
-- tricks: public read, authenticated insert
-- ====================================
CREATE POLICY "tricks_select_public"
  ON tricks FOR SELECT
  USING (true);

CREATE POLICY "tricks_insert_authenticated"
  ON tricks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ====================================
-- clips: public read (published only), owner insert/update/delete
-- ====================================
CREATE POLICY "clips_select_published"
  ON clips FOR SELECT
  USING (status = 'published');

CREATE POLICY "clips_insert_own"
  ON clips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clips_update_own"
  ON clips FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clips_delete_own"
  ON clips FOR DELETE
  USING (auth.uid() = user_id);

-- ====================================
-- best_plays: public read, owner insert/update/delete
-- ====================================
CREATE POLICY "best_plays_select_public"
  ON best_plays FOR SELECT
  USING (true);

CREATE POLICY "best_plays_insert_own"
  ON best_plays FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "best_plays_update_own"
  ON best_plays FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "best_plays_delete_own"
  ON best_plays FOR DELETE
  USING (auth.uid() = user_id);

-- ====================================
-- best_play_tricks: public read, owner of best_play insert/delete
-- ====================================
CREATE POLICY "best_play_tricks_select_public"
  ON best_play_tricks FOR SELECT
  USING (true);

CREATE POLICY "best_play_tricks_insert_own"
  ON best_play_tricks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM best_plays
      WHERE id = best_play_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "best_play_tricks_delete_own"
  ON best_play_tricks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM best_plays
      WHERE id = best_play_id AND user_id = auth.uid()
    )
  );

-- ====================================
-- clip_tricks: public read, authenticated insert/delete
-- ====================================
CREATE POLICY "clip_tricks_select_public"
  ON clip_tricks FOR SELECT
  USING (true);

CREATE POLICY "clip_tricks_insert_own"
  ON clip_tricks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clips
      WHERE id = clip_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "clip_tricks_delete_own"
  ON clip_tricks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clips
      WHERE id = clip_id AND user_id = auth.uid()
    )
  );

-- ====================================
-- user_tricks: public read, authenticated insert/update (own only)
-- ====================================
CREATE POLICY "user_tricks_select_public"
  ON user_tricks FOR SELECT
  USING (true);

CREATE POLICY "user_tricks_insert_own"
  ON user_tricks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_tricks_update_own"
  ON user_tricks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ====================================
-- claps: public read, authenticated insert/update/delete (own only)
-- ====================================
CREATE POLICY "claps_select_public"
  ON claps FOR SELECT
  USING (true);

CREATE POLICY "claps_insert_own"
  ON claps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "claps_update_own"
  ON claps FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "claps_delete_own"
  ON claps FOR DELETE
  USING (auth.uid() = user_id);

-- ====================================
-- clip_counters: public read (trigger-managed writes)
-- ====================================
CREATE POLICY "clip_counters_select_public"
  ON clip_counters FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies: managed by triggers via service role

-- ====================================
-- reports: reporter can read own, authenticated insert
-- ====================================
CREATE POLICY "reports_select_own"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

CREATE POLICY "reports_insert_authenticated"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

-- ====================================
-- deletion_logs: owner read/insert
-- ====================================
CREATE POLICY "deletion_logs_select_own"
  ON deletion_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "deletion_logs_insert_own"
  ON deletion_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
