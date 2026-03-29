import React, { useRef, useEffect, useState, useCallback, memo } from 'react'
import {
  View,
  TouchableWithoutFeedback,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { Video, ResizeMode } from 'expo-av'
import { VolumeX } from 'lucide-react-native'
import { colors } from '@/constants/colors'

const SCREEN_WIDTH = Dimensions.get('window').width

interface ClipPlayerProps {
  readonly videoUri: string
  readonly thumbnailUri: string
  readonly isVisible: boolean
}

export const ClipPlayer = memo(function ClipPlayer({
  videoUri,
  thumbnailUri,
  isVisible,
}: ClipPlayerProps) {
  const videoRef = useRef<Video>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!videoRef.current) return

    if (isVisible && !isPaused) {
      videoRef.current.playAsync()
    } else {
      videoRef.current.pauseAsync()
    }
  }, [isVisible, isPaused])

  const handlePress = useCallback(() => {
    setIsPaused((prev) => !prev)
  }, [])

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          posterSource={{ uri: thumbnailUri }}
          usePoster
          resizeMode={ResizeMode.COVER}
          isLooping
          isMuted
          shouldPlay={isVisible && !isPaused}
          style={styles.video}
        />
        <View style={styles.muteIcon}>
          <VolumeX size={14} color={colors.white} strokeWidth={2} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
})

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    aspectRatio: 9 / 16,
    backgroundColor: colors.black,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  muteIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
})
