-- ====================================
-- WALLER Database Schema v1.0
-- Migration 004: Storage Buckets and Policies
-- ====================================

-- ====================================
-- Create buckets
-- ====================================

-- clips bucket (clip videos and thumbnails)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('clips', 'clips', true, 52428800, ARRAY['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png']); -- 50MB, video + thumbnails

-- avatars bucket (profile images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']); -- 5MB, images only

-- best-plays bucket (best play videos and thumbnails)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('best-plays', 'best-plays', true, 104857600, ARRAY['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png']); -- 100MB, video + thumbnails

-- ====================================
-- clips bucket policies
-- ====================================

-- Public read access
CREATE POLICY "clips_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clips');

-- Authenticated users can upload to their own folder
CREATE POLICY "clips_storage_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'clips' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own files
CREATE POLICY "clips_storage_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'clips' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own files
CREATE POLICY "clips_storage_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'clips' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ====================================
-- avatars bucket policies
-- ====================================

-- Public read access
CREATE POLICY "avatars_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
CREATE POLICY "avatars_storage_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
CREATE POLICY "avatars_storage_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "avatars_storage_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ====================================
-- best-plays bucket policies
-- ====================================

-- Public read access
CREATE POLICY "best_plays_storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'best-plays');

-- Authenticated users can upload to their own folder
CREATE POLICY "best_plays_storage_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'best-plays' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own files
CREATE POLICY "best_plays_storage_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'best-plays' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own files
CREATE POLICY "best_plays_storage_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'best-plays' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
