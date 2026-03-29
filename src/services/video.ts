import * as VideoThumbnails from 'expo-video-thumbnails'
import { config } from '@/constants/config'

interface VideoAsset {
  readonly uri: string
  readonly duration?: number | null
  readonly fileSize?: number | null
}

interface VideoValidationOptions {
  readonly mode: 'clip' | 'bestPlay'
}

interface VideoValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}

export function validateVideo(
  asset: VideoAsset,
  options: VideoValidationOptions = { mode: 'clip' },
): VideoValidationResult {
  const errors: string[] = []

  const limits =
    options.mode === 'clip'
      ? { minDuration: config.clip.minDuration, maxDuration: config.clip.maxDuration, maxSizeMB: config.clip.maxSizeMB }
      : { minDuration: config.clip.minDuration, maxDuration: config.bestPlay.maxDuration, maxSizeMB: config.bestPlay.maxSizeMB }

  if (asset.duration != null) {
    const durationSeconds = asset.duration / 1000
    if (durationSeconds < limits.minDuration) {
      errors.push(`video_duration_short`)
    }
    if (durationSeconds > limits.maxDuration) {
      errors.push(`video_duration_long`)
    }
  }

  if (asset.fileSize != null) {
    const maxBytes = limits.maxSizeMB * 1024 * 1024
    if (asset.fileSize > maxBytes) {
      errors.push('video_too_large')
    }
  }

  if (!asset.uri) {
    errors.push('video_no_uri')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export async function generateThumbnail(
  videoUri: string,
  timeMs: number = 1000,
): Promise<string> {
  try {
    const result = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: timeMs,
    })
    return result.uri
  } catch (error) {
    throw new Error(
      `Thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
