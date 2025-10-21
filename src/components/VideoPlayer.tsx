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
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_HEIGHT = SCREEN_WIDTH * 1.5; // 最大高さは幅の1.5倍（縦長動画対応）

export function VideoPlayer({ videoUrl, thumbnailUrl, videoWidth, videoHeight, style }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);

  // 動画のアスペクト比を計算
  const calculateHeight = () => {
    if (videoWidth && videoHeight) {
      const aspectRatio = videoHeight / videoWidth;
      const calculatedHeight = SCREEN_WIDTH * aspectRatio;
      // 最大高さを制限
      return Math.min(calculatedHeight, MAX_HEIGHT);
    }
    // デフォルトは16:9
    return (SCREEN_WIDTH * 9) / 16;
  };

  const containerHeight = calculateHeight();

  const handlePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        // 一時停止
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        // 再生開始
        setShowThumbnail(false);
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Video playback error:', error);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    // 動画が終了したら最初に戻す
    if (status.didJustFinish) {
      setIsPlaying(false);
      setShowThumbnail(true);
      videoRef.current?.setPositionAsync(0);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { height: containerHeight }, style]}
      onPress={handlePlayPause}
      activeOpacity={0.9}
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
        resizeMode={ResizeMode.COVER} // COVERに変更して画面いっぱいに表示
        shouldPlay={false}
        isLooping={false}
        isMuted={true} // ミュート再生
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />

      {/* 再生/一時停止アイコン */}
      {!isPlaying && (
        <View style={styles.playIconContainer}>
          <Ionicons name="play-circle" size={60} color="rgba(255, 255, 255, 0.9)" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
    position: 'relative',
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
  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    zIndex: 2,
  },
});
