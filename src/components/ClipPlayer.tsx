import React, { useEffect, useState, useCallback, memo } from 'react'
import {
  View,
  TouchableWithoutFeedback,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { VolumeX } from 'lucide-react-native'
import { colors } from '@/constants/colors'

const SCREEN_WIDTH = Dimensions.get('window').width

type PlayerMode = 'active' | 'ready' | 'thumbnail'

interface ClipPlayerProps {
  readonly videoUri: string
  readonly thumbnailUri: string
  readonly isVisible: boolean
  readonly mode?: PlayerMode
}

function ClipPlayerVideo({
  videoUri,
  thumbnailUri,
  shouldPlay,
}: {
  readonly videoUri: string
  readonly thumbnailUri: string
  readonly shouldPlay: boolean
}) {
  const [isPaused, setIsPaused] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = true
    p.muted = true
  })

  useEffect(() => {
    if (shouldPlay && !isPaused) {
      player.play()
    } else {
      player.pause()
    }
  }, [shouldPlay, isPaused, player])

  useEffect(() => {
    const subscription = player.addListener('statusChange', (event) => {
      if (event.status === 'readyToPlay') {
        setIsLoaded(true)
      }
    })
    return () => subscription.remove()
  }, [player])

  const handlePress = useCallback(() => {
    setIsPaused((prev) => !prev)
  }, [])

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>
        {!isLoaded && (
          <Image source={{ uri: thumbnailUri }} style={styles.poster} />
        )}
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={false}
          contentFit="cover"
        />
        <View style={styles.muteIcon}>
          <VolumeX size={14} color={colors.white} strokeWidth={2} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

function ClipPlayerThumbnail({
  thumbnailUri,
}: {
  readonly thumbnailUri: string
}) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: thumbnailUri }} style={styles.poster} />
    </View>
  )
}

export const ClipPlayer = memo(function ClipPlayer({
  videoUri,
  thumbnailUri,
  isVisible,
  mode = 'active',
}: ClipPlayerProps) {
  if (mode === 'thumbnail') {
    return <ClipPlayerThumbnail thumbnailUri={thumbnailUri} />
  }

  const shouldPlay = mode === 'active' && isVisible

  return (
    <ClipPlayerVideo
      videoUri={videoUri}
      thumbnailUri={thumbnailUri}
      shouldPlay={shouldPlay}
    />
  )
})

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    aspectRatio: 9 / 16,
    backgroundColor: colors.black,
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    zIndex: 1,
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
    zIndex: 2,
  },
})
