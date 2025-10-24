import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { MainTabScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useVideoPicker } from '../../hooks/useVideoPicker';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';
import { generateThumbnail } from '../../utils/generateThumbnail';
import { uploadPostMedia } from '../../services/storage';
import { supabase } from '../../services/supabase';

type Props = MainTabScreenProps<'CreatePost'>;

// カテゴリタグの定義
const CATEGORIES = [
  { id: 'challenge', label: 'チャレンジ中', icon: '🔥' },
  { id: 'success', label: '成功！', icon: '🎉' },
  { id: 'practice', label: '練習記録', icon: '📝' },
  { id: 'combo', label: '連続技', icon: '🔄' },
  { id: 'new', label: '新技', icon: '✨' },
  { id: 'other', label: 'その他', icon: '' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

export function CreatePostScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { videoUri, videoInfo, pickVideo, clearVideo, isLoading: isPickingVideo } = useVideoPicker();
  const { toast, showToast, hideToast } = useToast();

  const scrollViewRef = useRef<ScrollView>(null);
  const captionInputRef = useRef<View>(null);

  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 動画選択処理
  const handlePickVideo = async () => {
    const result = await pickVideo();

    if (result) {
      // サムネイル生成
      console.log('🎬 サムネイル生成中...');
      const thumbnail = await generateThumbnail(result.uri, 1000); // 1秒地点
      if (thumbnail) {
        setThumbnailUri(thumbnail.uri);
        console.log('✅ サムネイル生成成功:', thumbnail.uri);
      } else {
        console.warn('⚠️ サムネイル生成失敗');
      }
    }
  };

  // リセット処理
  const handleReset = () => {
    Alert.alert('確認', '選択した動画を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          clearVideo();
          setThumbnailUri(null);
          setSelectedCategory(null);
          setCaption('');
        },
      },
    ]);
  };

  // 投稿処理
  const handleSubmit = async () => {
    if (!user || !videoUri || !thumbnailUri || !videoInfo) {
      showToast('動画を選択してください', 'warning');
      return;
    }

    if (!selectedCategory) {
      showToast('カテゴリを選択してください', 'warning');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log('📤 投稿処理開始');

      // 1. 一意なIDを生成（タイムスタンプベース）
      const postId = `${user.id}_${Date.now()}`;

      // 2. 動画とサムネイルをアップロード
      setUploadProgress(30);
      const uploadResult = await uploadPostMedia(
        user.id,
        postId,
        videoUri,
        thumbnailUri,
        (progress) => {
          setUploadProgress(30 + (progress.progress * 0.4)); // 30-70%
        }
      );

      if (!uploadResult) {
        throw new Error('動画のアップロードに失敗しました');
      }

      setUploadProgress(70);

      // 3. postsテーブルに挿入（idはSupabaseのgen_random_uuid()で自動生成）
      const { error: postError } = await supabase.from('posts').insert({
        user_id: user.id,
        video_url: uploadResult.videoUrl,
        thumbnail_url: uploadResult.thumbnailUrl,
        video_duration: Math.round(videoInfo.duration / 1000), // ミリ秒 → 秒
        video_size: videoInfo.fileSize,
        caption: caption.trim() || null,
        category_tag: selectedCategory,
        status: 'published',
      });

      if (postError) {
        console.error('❌ 投稿作成エラー:', postError);
        throw new Error('投稿の作成に失敗しました');
      }

      setUploadProgress(100);

      console.log('✅ 投稿完了');

      // 成功メッセージ
      showToast('投稿が公開されました！', 'success');

      // リセットしてホーム画面へ
      setTimeout(() => {
        clearVideo();
        setThumbnailUri(null);
        setSelectedCategory(null);
        setCaption('');
        navigation.navigate('Home');
      }, 1000);
    } catch (error: any) {
      console.error('投稿エラー:', error);
      showToast(error.message || '投稿に失敗しました', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // フォームのバリデーション
  const isFormValid = videoUri && selectedCategory && !isUploading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleReset} disabled={isUploading}>
            <Text style={[styles.headerButton, isUploading && styles.headerButtonDisabled]}>
              ✕
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>投稿作成</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={!isFormValid}>
            <Text
              style={[
                styles.headerButton,
                styles.submitHeaderButton,
                !isFormValid && styles.headerButtonDisabled,
              ]}
            >
              投稿する
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 動画選択 or プレビュー */}
          {!videoUri ? (
            <View style={styles.videoSelectContainer}>
              <TouchableOpacity
                style={styles.videoSelectButton}
                onPress={handlePickVideo}
                disabled={isPickingVideo}
              >
                {isPickingVideo ? (
                  <ActivityIndicator size="large" color="#FF6B00" />
                ) : (
                  <>
                    <Text style={styles.videoSelectIcon}>📹</Text>
                    <Text style={styles.videoSelectText}>カメラロールから動画を選択</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.videoSelectHint}>※ 3〜60秒、100MB以下</Text>
            </View>
          ) : (
            <>
              {/* 動画プレビュー */}
              <View style={styles.videoPreviewContainer}>
                <Video
                  source={{ uri: videoUri }}
                  style={styles.videoPreview}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                />
              </View>

              {/* カテゴリ選択 */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>カテゴリを選択</Text>
                <View style={styles.categoryContainer}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        selectedCategory === category.id && styles.categoryChipSelected,
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                      disabled={isUploading}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          selectedCategory === category.id && styles.categoryChipTextSelected,
                        ]}
                      >
                        {category.icon} {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* キャプション入力 */}
              <View
                style={styles.section}
                ref={captionInputRef}
                onLayout={() => {
                  // レイアウト計算後に位置を記録
                }}
              >
                <Text style={styles.sectionLabel}>キャプション (任意)</Text>
                <TextInput
                  style={styles.captionInput}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="今日の練習について書いてみよう..."
                  placeholderTextColor="#9E9E9E"
                  multiline
                  maxLength={200}
                  textAlignVertical="top"
                  editable={!isUploading}
                  onFocus={() => {
                    // キャプション入力にフォーカスが当たったら、スクロールして表示
                    setTimeout(() => {
                      captionInputRef.current?.measureLayout(
                        scrollViewRef.current as any,
                        (x, y) => {
                          scrollViewRef.current?.scrollTo({
                            y: y - 100, // 入力フォームの少し上までスクロール
                            animated: true,
                          });
                        },
                        () => {}
                      );
                    }, 100);
                  }}
                />
                <Text style={styles.charCount}>{caption.length}/200</Text>
              </View>

              {/* アップロード中のプログレスバー */}
              {isUploading && (
                <View style={styles.uploadingContainer}>
                  <Text style={styles.uploadingText}>投稿しています...</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                  </View>
                  <Text style={styles.uploadingPercentage}>{Math.round(uploadProgress)}%</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerButton: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  submitHeaderButton: {
    color: '#FF6B00',
  },
  headerButtonDisabled: {
    color: '#CCC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // 動画選択
  videoSelectContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  videoSelectButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    minHeight: 200,
    width: '100%',
  },
  videoSelectIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  videoSelectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  videoSelectHint: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 16,
  },

  // 動画プレビュー
  videoPreviewContainer: {
    aspectRatio: 9 / 16,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  videoPreview: {
    flex: 1,
  },

  // セクション
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },

  // カテゴリチップ
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipSelected: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },

  // キャプション入力
  captionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    color: '#1A1A1A',
  },
  charCount: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'right',
    marginTop: 4,
  },

  // アップロード中
  uploadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  uploadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 4,
  },
  uploadingPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
  },
});
