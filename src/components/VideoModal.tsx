import React, { useRef, useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
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
  const [isPlaying, setIsPlaying] = useState(true);

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Video playback error:', error);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  };

  const handleClose = async () => {
    // 動画を停止してモーダルを閉じる
    if (videoRef.current) {
      await videoRef.current.stopAsync();
      await videoRef.current.setPositionAsync(0);
    }
    setIsPlaying(false);
    onClose();
  };

  // モーダルが開いた時に自動再生を開始
  const handleModalShow = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
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
            shouldPlay={true}
            isLooping={true}
            isMuted={false} // 全画面では音声ON
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />

          {/* 再生/一時停止アイコン */}
          {!isPlaying && (
            <View style={styles.playIconContainer}>
              <Ionicons name="play-circle" size={80} color="rgba(255, 255, 255, 0.9)" />
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
  },
});
