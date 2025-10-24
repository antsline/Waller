-- Supabase Storageバケットのセットアップ
-- Supabase Dashboard > Storage > New bucket で実行

-- 1. user-contentバケットを作成（まだ存在しない場合）
-- Supabase Dashboard UI で以下の設定でバケットを作成:
-- - Name: user-content
-- - Public: ON (公開バケット)
-- - File size limit: 5MB
-- - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- 2. ストレージポリシーの設定（SQLエディタで実行）

-- 誰でも画像を閲覧可能
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-content');

-- 認証済みユーザーのみアップロード可能
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-content'
  AND auth.role() = 'authenticated'
);

-- 自分がアップロードしたファイルのみ更新・削除可能
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 完了！
-- これで以下のフォルダ構造でファイルがアップロードされます:
-- - avatars/{user_id}-{timestamp}.{ext}
