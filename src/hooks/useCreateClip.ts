import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Crypto from 'expo-crypto'
import { supabase } from '@/lib/supabase'
import { uploadClipVideo, uploadThumbnail, deleteStorageFile } from '@/services/storage'
import { createClipInputSchema } from '@/utils/validation'
import { useAuthStore } from '@/stores/authStore'
import { useClipUploadStore } from '@/stores/clipUploadStore'
import type { MoodType } from '@/types/models'

interface CreateClipParams {
  readonly videoUri: string
  readonly thumbnailUri: string
  readonly videoDuration: number
  readonly videoSize: number
  readonly mood: MoodType
  readonly caption?: string | null
  readonly facility_tag?: string | null
  readonly trick_ids?: readonly string[]
}

async function executeCreateClip(
  params: CreateClipParams,
  userId: string,
  setStep: (step: 'video' | 'thumbnail' | 'saving' | 'done') => void,
): Promise<void> {
  const validated = createClipInputSchema.parse({
    mood: params.mood,
    caption: params.caption,
    facility_tag: params.facility_tag,
    trick_ids: params.trick_ids,
  })

  const clipId = Crypto.randomUUID()
  let videoUrl: string | null = null
  let thumbnailUrl: string | null = null

  try {
    setStep('video')
    videoUrl = await uploadClipVideo(userId, clipId, params.videoUri)

    setStep('thumbnail')
    thumbnailUrl = await uploadThumbnail(userId, clipId, params.thumbnailUri)

    setStep('saving')
    const { error: clipError } = await supabase.from('clips').insert({
      id: clipId,
      user_id: userId,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      video_duration: params.videoDuration,
      video_size: params.videoSize,
      mood: validated.mood,
      caption: validated.caption ?? null,
      facility_tag: validated.facility_tag ?? null,
    })

    if (clipError) {
      throw new Error('Failed to save clip')
    }

    if (validated.trick_ids && validated.trick_ids.length > 0) {
      const clipTricks = validated.trick_ids.map((trickId) => ({
        clip_id: clipId,
        trick_id: trickId,
      }))

      const { error: tricksError } = await supabase
        .from('clip_tricks')
        .insert(clipTricks)

      if (tricksError) {
        throw new Error('Failed to save trick tags')
      }
    }

    setStep('done')
  } catch (error) {
    // Clean up uploaded files on failure
    try {
      if (videoUrl) {
        await deleteStorageFile('clips', userId, `${userId}/${clipId}/video.mp4`)
      }
      if (thumbnailUrl) {
        await deleteStorageFile('clips', userId, `${userId}/${clipId}/thumbnail.jpg`)
      }
    } catch {
      // Cleanup failure is non-critical
    }
    throw error
  }
}

export function useCreateClip() {
  const queryClient = useQueryClient()
  const session = useAuthStore((s) => s.session)
  const setStep = useClipUploadStore((s) => s.setStep)
  const setError = useClipUploadStore((s) => s.setError)
  const reset = useClipUploadStore((s) => s.reset)

  return useMutation({
    mutationFn: (params: CreateClipParams) => {
      const userId = session?.user?.id
      if (!userId) {
        throw new Error('Not authenticated')
      }
      return executeCreateClip(params, userId, setStep)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clips'] })
      setTimeout(reset, 1500)
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Upload failed')
    },
  })
}
