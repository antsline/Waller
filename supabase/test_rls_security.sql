-- ====================================
-- RLSポリシーのセキュリティテスト
-- Supabase SQL Editorで実行してください
-- ====================================

-- テスト1: 認証なしで投稿を閲覧できるか（できるべき）
-- これは成功するべき
SELECT COUNT(*) as "公開投稿数（認証なし）"
FROM posts
WHERE status = 'published';

-- テスト2: 認証なしで下書き投稿を閲覧できないか（できないべき）
-- これは0件になるべき
SELECT COUNT(*) as "下書き投稿数（認証なし - 0であるべき）"
FROM posts
WHERE status = 'draft';

-- テスト3: すべてのテーブルでRLSが有効か確認
SELECT
    tablename,
    CASE
        WHEN rowsecurity = true THEN '✅ 有効'
        ELSE '❌ 無効'
    END as "RLS状態"
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('users', 'player_profiles', 'posts', 'likes', 'reactions', 'post_counters', 'reports', 'deletion_logs')
ORDER BY tablename;

-- テスト4: 各テーブルのポリシー数を確認
SELECT
    tablename as "テーブル名",
    COUNT(*) as "ポリシー数"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- テスト5: 重要なポリシーの存在確認
SELECT
    tablename as "テーブル",
    policyname as "ポリシー名",
    cmd as "操作",
    CASE
        WHEN policyname LIKE '%own%' OR qual LIKE '%auth.uid()%' THEN '✅ 本人のみアクセス'
        WHEN qual = 'true' THEN '⚠️ 全員アクセス可能'
        ELSE '🔒 条件付きアクセス'
    END as "アクセス制御"
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('users', 'posts', 'likes', 'reactions', 'player_profiles')
ORDER BY tablename, cmd, policyname;

-- ====================================
-- 期待される結果:
-- ====================================
-- テスト1: 投稿が表示される
-- テスト2: 0件（下書きは認証なしでは見えない）
-- テスト3: すべてのテーブルで「✅ 有効」
-- テスト4: 各テーブルに適切な数のポリシーが存在
-- テスト5: 重要な操作（UPDATE/DELETE）は「本人のみアクセス」
