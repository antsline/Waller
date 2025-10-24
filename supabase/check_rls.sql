-- RLSが有効になっているか確認
-- Supabase SQL Editorで実行してください

SELECT
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 各テーブルのポリシー一覧を確認
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as "USING clause",
    with_check as "WITH CHECK clause"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
