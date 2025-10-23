-- ====================================
-- deletion_logs テーブルのRLSポリシー追加
-- ====================================

-- ユーザーは自分の削除ログを挿入できる
CREATE POLICY "Users can insert their own deletion logs"
  ON deletion_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の削除ログを閲覧できる（削除回数制限チェックのため）
CREATE POLICY "Users can view their own deletion logs"
  ON deletion_logs
  FOR SELECT
  USING (auth.uid() = user_id);
