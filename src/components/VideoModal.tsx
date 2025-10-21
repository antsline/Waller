import React, { useRef, useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Text,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface VideoModalProps {
  visible: boolean;
  videoUrl: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function VideoModal({ visible, videoUrl, onClose }: VideoModalProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false); // 最初は一時停止
  const [showControls, setShowControls] = useState(true); // コントロール表示状態
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false); // 一度でも再生されたか
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
        setShowControls(true); // 一時停止時はコントロールを表示
        if (hideControlsTimeout.current) {
          clearTimeout(hideControlsTimeout.current);
        }
      } else {
        // 再生開始前に動画の状態を確認
        const status = await videoRef.current.getStatusAsync();

        // 動画が終了している、または終端近くにいる場合は最初から再生
        if (status.isLoaded) {
          const { positionMillis, durationMillis } = status;

          // 終端近く（残り1秒以内）または終了している場合は最初に戻す
          if (durationMillis && (positionMillis >= durationMillis - 1000 || status.didJustFinish)) {
            await videoRef.current.setPositionAsync(0);
          }
        }

        await videoRef.current.playAsync();
        setIsPlaying(true);
        setHasStartedPlaying(true); // 再生開始済みフラグ
        setShowControls(true); // 一瞬表示してから消す

        // 2秒後にコントロールを非表示
        if (hideControlsTimeout.current) {
          clearTimeout(hideControlsTimeout.current);
        }
        hideControlsTimeout.current = setTimeout(() => {
          setShowControls(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Video playback error:', error);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    // 再生状態を同期
    if (status.isPlaying && !isPlaying) {
      setIsPlaying(true);
    } else if (!status.isPlaying && isPlaying) {
      setIsPlaying(false);
    }

    // 動画終了時はコントロールを表示
    if (status.didJustFinish) {
      setIsPlaying(false);
      setShowControls(true);
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    }
  };

  const handleClose = async () => {
    // タイムアウトをクリア
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }

    // 動画を停止してモーダルを閉じる
    if (videoRef.current) {
      await videoRef.current.stopAsync();
      await videoRef.current.setPositionAsync(0);
    }
    setIsPlaying(false);
    setShowControls(true);
    setHasStartedPlaying(false);
    onClose();
  };

  // モーダルが開いた時の処理
  const handleModalShow = () => {
    // 最初は一時停止状態（ユーザーがタップして再生）
    setIsPlaying(false);
    setShowControls(true);
    setHasStartedPlaying(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
      onShow={handleModalShow}
      transparent={false}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* 閉じるボタン */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <View style={styles.closeButtonCircle}>
            <Ionicons name="close" size={28} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* 動画プレイヤー */}
        <TouchableOpacity
          style={styles.videoContainer}
          onPress={handlePlayPause}
          activeOpacity={1}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false} // 手動再生
            isLooping={false} // 1回のみ再生
            isMuted={false} // 全画面では音声ON
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            useNativeControls={false}
          />

          {/* 再生/一時停止アイコン（showControlsがtrueの時のみ表示） */}
          {showControls && (
            <View style={styles.playIconContainer}>
              <Ionicons
                name={isPlaying ? 'pause-circle' : 'play-circle'}
                size={80}
                color="rgba(255, 255, 255, 0.9)"
              />
            </View>
          )}

          {/* 音声ONの案内（最初の1回のみ表示） */}
          {!hasStartedPlaying && (
            <View style={styles.audioHint}>
              <Ionicons name="volume-high" size={20} color="#fff" />
              <Text style={styles.audioHintText}>タップして音声付きで再生</Text>
            </View>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    opacity: 0.8,
  },
  audioHint: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignSelf: 'center',
  },
  audioHintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
