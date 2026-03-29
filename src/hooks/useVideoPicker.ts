import { useState, useCallback } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { validateVideo, generateThumbnail } from '@/services/video'

type VideoPickerMode = 'clip' | 'bestPlay'

interface UseVideoPickerResult {
  readonly videoUri: string | null
  readonly thumbnailUri: string | null
  readonly duration: number | null
  readonly fileSize: number | null
  readonly error: string | null
  readonly loading: boolean
  readonly pickVideo: () => Promise<void>
  readonly clearVideo: () => void
}

export function useVideoPicker(mode: VideoPickerMode = 'clip'): UseVideoPickerResult {
  const [videoUri, setVideoUri] = useState<string | null>(null)
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const pickVideo = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 1,
        videoQuality: 1,
      })

      if (result.canceled) {
        return
      }

      const asset = result.assets[0]

      const validation = validateVideo(
        {
          uri: asset.uri,
          duration: asset.duration,
          fileSize: asset.fileSize,
        },
        { mode },
      )

      if (!validation.valid) {
        setError(validation.errors[0])
        return
      }

      let thumbnail: string | null = null
      try {
        thumbnail = await generateThumbnail(asset.uri)
      } catch {
        // Thumbnail generation is non-critical; proceed without it
      }

      setVideoUri(asset.uri)
      setThumbnailUri(thumbnail)
      setDuration(asset.duration ?? null)
      setFileSize(asset.fileSize ?? null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pick video'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [mode])

  const clearVideo = useCallback(() => {
    setVideoUri(null)
    setThumbnailUri(null)
    setDuration(null)
    setFileSize(null)
    setError(null)
  }, [])

  return { videoUri, thumbnailUri, duration, fileSize, error, loading, pickVideo, clearVideo }
}
