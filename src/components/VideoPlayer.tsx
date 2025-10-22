import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
  videoWidth?: number;
  videoHeight?: number;
  style?: any;
  onPress?: () => void; // タップ時のコールバック
  isActive?: boolean; // フィードで画面中央に表示されているか（自動再生制御用）
  initialMuted?: boolean; // 初期ミュート状態
  onMuteToggle?: (muted: boolean) => void; // ミュート切り替えコールバック
  showControls?: boolean; // 再生コントロールを表示するか（投稿詳細用）
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const FEED_MAX_HEIGHT = 400; // フィード表示時の最大高さ

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  videoWidth,
  videoHeight,
  style,
  onPress: onPressCallback,
  isActive = false,
  initialMuted = true,
  onMuteToggle,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [isMuted, setIsMuted] = useState(initialMuted);

  // 動画のアスペクト比を計算
  const calculateHeight = () => {
    if (videoWidth && videoHeight) {
      const aspectRatio = videoHeight / videoWidth;
      const calculatedHeight = SCREEN_WIDTH * aspectRatio;
      // フィード表示時は最大高さを400pxに制限
      return Math.min(calculatedHeight, FEED_MAX_HEIGHT);
    }
    // デフォルトは16:9で350px程度
    return 350;
  };

  const containerHeight = calculateHeight();

  const handlePress = () => {
    // カスタムコールバックがあればそれを呼ぶ
    if (onPressCallback) {
      onPressCallback();
    }
  };

  const handleMuteToggle = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    if (videoRef.current) {
      await videoRef.current.setIsMutedAsync(newMutedState);
    }

    if (onMuteToggle) {
      onMuteToggle(newMutedState);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    // 再生状態を同期
    setIsPlaying(status.isPlaying);

    // 動画が終了したらサムネイルに戻る（1回のみ再生）
    if (status.didJustFinish) {
      setShowThumbnail(true);
      setIsPlaying(false);
      videoRef.current?.setPositionAsync(0);
    }
  };

  // サムネイルタップで全画面表示
  const handleThumbnailPress = () => {
    if (showThumbnail && onPressCallback) {
      // もう一度見る = 全画面で詳細確認
      onPressCallback();
    }
  };

  // isActiveが変更されたら自動再生を制御
  React.useEffect(() => {
    if (!videoRef.current) return;

    const controlPlayback = async () => {
      try {
        if (isActive) {
          // アクティブになったら自動再生開始
          setShowThumbnail(false);
          await videoRef.current?.playAsync();
        } else {
          // 非アクティブになったら停止
          await videoRef.current?.pauseAsync();
          await videoRef.current?.setPositionAsync(0);
          setShowThumbnail(true);
        }
      } catch (error) {
        console.error('Playback control error:', error);
      }
    };

    controlPlayback();
  }, [isActive]);

  // Instagram Feed風の表示
  return (
    <TouchableOpacity
      style={[styles.container, { height: containerHeight }, style]}
      onPress={handlePress}
      activeOpacity={1}
    >
      {/* サムネイル（未再生時のみ表示） */}
      {showThumbnail && (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
      )}

      {/* 動画 */}
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping={false}
        isMuted={isMuted}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />

      {/* サムネイル上の「もう一度見る」アイコン */}
      {showThumbnail && (
        <TouchableOpacity
          style={styles.replayOverlay}
          onPress={handleThumbnailPress}
          activeOpacity={0.8}
        >
          <View style={styles.replayIconContainer}>
            <Ionicons name="reload-circle" size={60} color="rgba(255, 255, 255, 0.9)" />
          </View>
        </TouchableOpacity>
      )}

      {/* 再生アイコン（一時停止時のみ） */}
      {!isPlaying && !showThumbnail && (
        <View style={styles.playIconContainer}>
          <Ionicons name="play-circle" size={60} color="rgba(255, 255, 255, 0.9)" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  replayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  replayIconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 50,
    padding: 8,
  },
  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    zIndex: 2,
  },
});
