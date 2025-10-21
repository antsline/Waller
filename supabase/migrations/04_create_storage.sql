-- ====================================
-- Waller Database Schema
-- Migration 04: Storage Buckets and Policies
-- ====================================

-- ====================================
-- バケット作成
-- ====================================

-- videos バケット（動画・サムネイル）
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true);

-- avatars バケット（プロフィール画像）
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- ====================================
-- videos バケットのポリシー
-- ====================================

-- 全員が動画・サムネイルを閲覧可能
CREATE POLICY "Videos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

-- 認証済みユーザーは自分のフォルダにアップロード可能
CREATE POLICY "Users can upload videos to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 自分がアップロードしたファイルのみ削除可能
CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ====================================
-- avatars バケットのポリシー
-- ====================================

-- 全員がアバターを閲覧可能
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 認証済みユーザーは自分のアバターをアップロード可能
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 自分のアバターのみ更新可能
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 自分のアバターのみ削除可能
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
