import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export function useImagePicker() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    try {
      setIsLoading(true);

      // パーミッション確認
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          '権限が必要です',
          'フォトライブラリへのアクセス権限を許可してください。'
        );
        return;
      }

      // 画像選択
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // 正方形
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('画像選択エラー:', error);
      Alert.alert('エラー', '画像の選択に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setImageUri(null);
  };

  return {
    imageUri,
    pickImage,
    clearImage,
    isLoading,
  };
}
