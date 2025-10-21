import * as VideoThumbnails from 'expo-video-thumbnails';

export interface ThumbnailResult {
  uri: string;
  width: number;
  height: number;
}

/**
 * 動画からサムネイル画像を生成する
 * @param videoUri 動画のURI
 * @param timeMs サムネイルを取得する時間（ミリ秒）デフォルト: 1000ms（1秒）
 * @returns サムネイルのURI、幅、高さ
 */
export async function generateThumbnail(
  videoUri: string,
  timeMs: number = 1000
): Promise<ThumbnailResult | null> {
  try {
    console.log('🎬 サムネイル生成開始:', { videoUri, timeMs });

    const { uri, width, height } = await VideoThumbnails.getThumbnailAsync(
      videoUri,
      {
        time: timeMs,
        quality: 0.8, // 画質（0-1）
      }
    );

    console.log('✅ サムネイル生成成功:', { uri, width, height });

    return {
      uri,
      width,
      height,
    };
  } catch (error) {
    console.error('❌ サムネイル生成エラー:', error);
    return null;
  }
}
