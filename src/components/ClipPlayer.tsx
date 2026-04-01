import React, { useEffect, useState, useCallback, memo } from 'react'
import {
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { VolumeX, Volume2, Pause } from 'lucide-react-native'
import { colors } from '@/constants/colors'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')
// Header(44) + StatusBar(~54) + TabBar(~83) + tags/actions area(~80)
const CHROME_HEIGHT = 260
const VIDEO_HEIGHT = Math.min(
  SCREEN_WIDTH * (16 / 9),
  SCREEN_HEIGHT - CHROME_HEIGHT,
)

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
  const [isMuted, setIsMuted] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = true
    p.muted = true
  })

  useEffect(() => {
    if (shouldPlay && !isPaused) {
      player.playbackRate = 1
      player.play()
    } else {
      // Use playbackRate=0 instead of pause() to avoid iOS PiP controls
      player.playbackRate = 0
    }
  }, [shouldPlay, isPaused, player])

  useEffect(() => {
    player.muted = isMuted
  }, [isMuted, player])

  useEffect(() => {
    const subscription = player.addListener('statusChange', (event) => {
      if (event.status === 'readyToPlay') {
        setIsLoaded(true)
      }
    })
    return () => subscription.remove()
  }, [player])

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev)
  }, [])

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  const MuteIcon = isMuted ? VolumeX : Volume2

  return (
    <TouchableWithoutFeedback onPress={handleTogglePause}>
      <View style={styles.container}>
        {!isLoaded && (
          <Image source={{ uri: thumbnailUri }} style={styles.poster} />
        )}
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={false}
          allowsPictureInPicture={false}
          contentFit="cover"
        />
        {isPaused && (
          <View style={styles.pauseOverlay}>
            <Pause size={48} color={colors.white} fill={colors.white} />
          </View>
        )}
        <TouchableOpacity
          style={styles.muteIcon}
          onPress={handleToggleMute}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MuteIcon size={18} color={colors.white} strokeWidth={2} />
        </TouchableOpacity>
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
    height: VIDEO_HEIGHT,
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
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 2,
  },
  muteIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 8,
    zIndex: 3,
  },
})
