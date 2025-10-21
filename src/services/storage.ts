import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

export interface UploadProgress {
  progress: number; // 0-100
  loaded: number;
  total: number;
}

/**
 * 動画をSupabase Storageにアップロード
 * @param userId ユーザーID
 * @param postId 投稿ID
 * @param videoUri 動画のローカルURI
 * @param onProgress アップロード進捗コールバック
 * @returns アップロードされた動画の公開URL
 */
export async function uploadVideo(
  userId: string,
  postId: string,
  videoUri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string | null> {
  try {
    console.log('📤 動画アップロード開始:', { userId, postId, videoUri });

    // ファイルパス: {user_id}/{post_id}.mp4
    const filePath = `${userId}/${postId}.mp4`;

    // ファイルをbase64で読み込む
    const base64 = await FileSystem.readAsStringAsync(videoUri, {
      encoding: 'base64',
    });

    // base64をArrayBufferにデコード
    const arrayBuffer = decode(base64);

    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, arrayBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: false, // 同じファイル名は上書きしない
      });

    if (error) {
      console.error('❌ 動画アップロードエラー:', error);
      throw error;
    }

    console.log('✅ 動画アップロード成功:', data.path);

    // 公開URL取得
    const { data: publicUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    console.log('🔗 動画公開URL:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ uploadVideo エラー:', error);
    return null;
  }
}

/**
 * サムネイルをSupabase Storageにアップロード
 * @param userId ユーザーID
 * @param postId 投稿ID
 * @param thumbnailUri サムネイルのローカルURI
 * @returns アップロードされたサムネイルの公開URL
 */
export async function uploadThumbnail(
  userId: string,
  postId: string,
  thumbnailUri: string
): Promise<string | null> {
  try {
    console.log('📤 サムネイルアップロード開始:', { userId, postId, thumbnailUri });

    // ファイルパス: {user_id}/{post_id}_thumb.jpg
    const filePath = `${userId}/${postId}_thumb.jpg`;

    // ファイルをbase64で読み込む
    const base64 = await FileSystem.readAsStringAsync(thumbnailUri, {
      encoding: 'base64',
    });

    // base64をArrayBufferにデコード
    const arrayBuffer = decode(base64);

    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ サムネイルアップロードエラー:', error);
      throw error;
    }

    console.log('✅ サムネイルアップロード成功:', data.path);

    // 公開URL取得
    const { data: publicUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    console.log('🔗 サムネイル公開URL:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ uploadThumbnail エラー:', error);
    return null;
  }
}

/**
 * 動画とサムネイルを同時にアップロード
 * @param userId ユーザーID
 * @param postId 投稿ID
 * @param videoUri 動画のローカルURI
 * @param thumbnailUri サムネイルのローカルURI
 * @param onProgress アップロード進捗コールバック
 * @returns 動画URLとサムネイルURL
 */
export async function uploadPostMedia(
  userId: string,
  postId: string,
  videoUri: string,
  thumbnailUri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ videoUrl: string; thumbnailUrl: string } | null> {
  try {
    console.log('📦 投稿メディアアップロード開始');

    // 動画とサムネイルを並列アップロード
    const [videoUrl, thumbnailUrl] = await Promise.all([
      uploadVideo(userId, postId, videoUri, onProgress),
      uploadThumbnail(userId, postId, thumbnailUri),
    ]);

    if (!videoUrl || !thumbnailUrl) {
      throw new Error('メディアのアップロードに失敗しました');
    }

    console.log('✅ 投稿メディアアップロード完了');

    return {
      videoUrl,
      thumbnailUrl,
    };
  } catch (error) {
    console.error('❌ uploadPostMedia エラー:', error);
    return null;
  }
}

/**
 * 動画を削除
 * @param userId ユーザーID
 * @param postId 投稿ID
 */
export async function deleteVideo(userId: string, postId: string): Promise<boolean> {
  try {
    console.log('🗑️ 動画削除開始:', { userId, postId });

    const videoPath = `${userId}/${postId}.mp4`;
    const thumbPath = `${userId}/${postId}_thumb.jpg`;

    // 動画とサムネイルを削除
    const { error: videoError } = await supabase.storage
      .from('videos')
      .remove([videoPath, thumbPath]);

    if (videoError) {
      console.error('❌ 動画削除エラー:', videoError);
      return false;
    }

    console.log('✅ 動画削除成功');
    return true;
  } catch (error) {
    console.error('❌ deleteVideo エラー:', error);
    return false;
  }
}
