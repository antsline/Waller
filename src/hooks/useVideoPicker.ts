import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// 動画のバリデーション定数
const MIN_DURATION_MS = 3000; // 3秒
const MAX_DURATION_MS = 60000; // 60秒
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export interface VideoPickerResult {
  uri: string;
  duration: number; // ミリ秒
  fileSize: number; // バイト
  width: number;
  height: number;
}

export function useVideoPicker() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoPickerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickVideo = async (): Promise<VideoPickerResult | null> => {
    try {
      setIsLoading(true);

      // パーミッション確認
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          '権限が必要です',
          'フォトライブラリへのアクセス権限を許可してください。'
        );
        return null;
      }

      // 動画選択
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 60, // 最大60秒
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];

      // 動画であることを確認
      if (asset.type !== 'video') {
        Alert.alert('エラー', '動画を選択してください。');
        return null;
      }

      // duration のチェック（必須）
      if (!asset.duration) {
        Alert.alert('エラー', '動画の長さを取得できませんでした。');
        return null;
      }

      // fileSize のチェック（オプショナルだが、できれば取得）
      const fileSize = asset.fileSize || 0;

      console.log('📹 選択された動画情報:', {
        uri: asset.uri,
        duration: asset.duration,
        fileSize,
        width: asset.width,
        height: asset.height,
      });

      // 動画の長さをチェック（3-60秒）
      if (asset.duration < MIN_DURATION_MS) {
        Alert.alert(
          '動画が短すぎます',
          `動画は3秒以上である必要があります。\n選択された動画: ${Math.round(asset.duration / 1000)}秒`
        );
        return null;
      }

      if (asset.duration > MAX_DURATION_MS) {
        Alert.alert(
          '動画が長すぎます',
          `動画は60秒以内である必要があります。\n選択された動画: ${Math.round(asset.duration / 1000)}秒`
        );
        return null;
      }

      // ファイルサイズをチェック（100MB以下）
      if (fileSize > 0 && fileSize > MAX_FILE_SIZE_BYTES) {
        const sizeMB = Math.round(fileSize / (1024 * 1024));
        Alert.alert(
          'ファイルサイズが大きすぎます',
          `動画は100MB以下である必要があります。\n選択された動画: ${sizeMB}MB`
        );
        return null;
      }

      // バリデーション通過 - 状態を更新
      const videoData: VideoPickerResult = {
        uri: asset.uri,
        duration: asset.duration,
        fileSize,
        width: asset.width,
        height: asset.height,
      };

      setVideoUri(asset.uri);
      setVideoInfo(videoData);

      console.log('✅ 動画選択成功');
      return videoData;
    } catch (error) {
      console.error('動画選択エラー:', error);
      Alert.alert('エラー', '動画の選択に失敗しました。');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearVideo = () => {
    setVideoUri(null);
    setVideoInfo(null);
  };

  return {
    videoUri,
    videoInfo,
    pickVideo,
    clearVideo,
    isLoading,
  };
}
