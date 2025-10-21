-- ====================================
-- Waller Database Schema
-- Migration 03: Row Level Security Policies
-- ====================================

-- ====================================
-- RLS有効化
-- ====================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_logs ENABLE ROW LEVEL SECURITY;

-- ====================================
-- users テーブルのポリシー
-- ====================================

-- 全員が全ユーザーを参照可能（公開プロフィール）
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (status = 'active');

-- 自分のレコードのみ挿入可能
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 自分のレコードのみ更新可能
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ====================================
-- player_profiles テーブルのポリシー
-- ====================================

-- 全員が閲覧可能
CREATE POLICY "Player profiles are viewable by everyone"
  ON player_profiles FOR SELECT
  USING (true);

-- プレーヤーのみ自分のプロフィール作成可能
CREATE POLICY "Players can insert their own profile"
  ON player_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'player')
  );

-- 自分のプロフィールのみ更新可能
CREATE POLICY "Players can update their own profile"
  ON player_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ====================================
-- posts テーブルのポリシー
-- ====================================

-- 公開済み投稿は全員閲覧可能
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT
  USING (status = 'published');

-- プレーヤーのみ投稿可能
CREATE POLICY "Players can insert posts"
  ON posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'player')
  );

-- 自分の投稿のみ更新可能
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 自分の投稿のみ削除可能
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- ====================================
-- likes テーブルのポリシー
-- ====================================

-- いいねは全員閲覧可能
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

-- 認証済みユーザーはいいね可能
CREATE POLICY "Authenticated users can insert likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のいいねのみ削除可能
CREATE POLICY "Users can delete their own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- ====================================
-- reactions テーブルのポリシー
-- ====================================

-- リアクションは全員閲覧可能
CREATE POLICY "Reactions are viewable by everyone"
  ON reactions FOR SELECT
  USING (true);

-- 認証済みユーザーはリアクション可能
CREATE POLICY "Authenticated users can insert reactions"
  ON reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のリアクションのみ更新可能
CREATE POLICY "Users can update their own reactions"
  ON reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 自分のリアクションのみ削除可能
CREATE POLICY "Users can delete their own reactions"
  ON reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ====================================
-- post_counters テーブルのポリシー
-- ====================================

-- カウンターは全員閲覧可能
CREATE POLICY "Post counters are viewable by everyone"
  ON post_counters FOR SELECT
  USING (true);

-- カウンターはトリガーのみ更新（直接更新不可）
-- 挿入・更新・削除ポリシーは設定しない

-- ====================================
-- reports テーブルのポリシー
-- ====================================

-- 通報は本人のみ閲覧可能
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

-- 認証済みユーザーは通報可能
CREATE POLICY "Authenticated users can insert reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

-- ====================================
-- deletion_logs テーブルのポリシー
-- ====================================

-- 削除ログは運営のみ閲覧（一般ユーザーは見えない）
-- SELECTポリシーなし = デフォルト拒否

-- ログ挿入は削除時の関数から自動実行
-- INSERTポリシーは不要（サービスロールで実行）
