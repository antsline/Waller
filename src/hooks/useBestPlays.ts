import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Crypto from 'expo-crypto'
import { supabase } from '@/lib/supabase'
import {
  uploadBestPlay,
  uploadBestPlayThumbnail,
  deleteStorageFile,
} from '@/services/storage'
import { bestPlayInputSchema } from '@/utils/validation'
import { useAuthStore } from '@/stores/authStore'
import { useBestPlayUploadStore } from '@/stores/bestPlayUploadStore'
import type { BestPlayWithTricks, MoodType } from '@/types/models'

async function fetchBestPlays(userId: string): Promise<readonly BestPlayWithTricks[]> {
  const { data, error } = await supabase
    .from('best_plays')
    .select(
      `
      *,
      best_play_tricks(trick:tricks(id, name_original, name_en, name_ja))
    `,
    )
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error('Failed to fetch best plays')
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const rawTricks = Array.isArray(row.best_play_tricks)
      ? row.best_play_tricks
          .map((bt: Record<string, unknown>) => bt.trick)
          .filter(Boolean)
      : []

    return {
      ...(row as Record<string, unknown>),
      tricks: rawTricks,
    } as unknown as BestPlayWithTricks
  })
}

export function useBestPlays(userId: string | undefined) {
  return useQuery({
    queryKey: ['best-plays', userId],
    queryFn: () => fetchBestPlays(userId!),
    enabled: !!userId,
  })
}

interface CreateBestPlayParams {
  readonly videoUri: string
  readonly thumbnailUri: string
  readonly videoDuration: number
  readonly videoSize: number
  readonly sortOrder: number
  readonly title?: string | null
  readonly mood?: MoodType | null
  readonly facility_tag?: string | null
  readonly trick_ids?: readonly string[]
}

export function useCreateBestPlay() {
  const queryClient = useQueryClient()
  const session = useAuthStore((s) => s.session)
  const setStep = useBestPlayUploadStore((s) => s.setStep)
  const setError = useBestPlayUploadStore((s) => s.setError)
  const reset = useBestPlayUploadStore((s) => s.reset)

  return useMutation({
    mutationFn: async (params: CreateBestPlayParams) => {
      const userId = session?.user?.id
      if (!userId) {
        throw new Error('Not authenticated')
      }

      const validated = bestPlayInputSchema.parse({
        title: params.title,
        mood: params.mood,
        facility_tag: params.facility_tag,
        trick_ids: params.trick_ids,
      })

      const bestPlayId = Crypto.randomUUID()
      let videoUrl: string | null = null
      let thumbnailUrl: string | null = null

      try {
        setStep('video')
        videoUrl = await uploadBestPlay(userId, bestPlayId, params.videoUri)

        setStep('thumbnail')
        thumbnailUrl = await uploadBestPlayThumbnail(userId, bestPlayId, params.thumbnailUri)

        setStep('saving')
        const { error: insertError } = await supabase.from('best_plays').insert({
          id: bestPlayId,
          user_id: userId,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          video_duration: params.videoDuration,
          video_size: params.videoSize,
          title: validated.title ?? null,
          mood: validated.mood ?? null,
          facility_tag: validated.facility_tag ?? null,
          sort_order: params.sortOrder,
        })

        if (insertError) {
          throw new Error('Failed to save best play')
        }

        if (validated.trick_ids && validated.trick_ids.length > 0) {
          const bestPlayTricks = validated.trick_ids.map((trickId) => ({
            best_play_id: bestPlayId,
            trick_id: trickId,
          }))

          const { error: tricksError } = await supabase
            .from('best_play_tricks')
            .insert(bestPlayTricks)

          if (tricksError) {
            throw new Error('Failed to save trick tags')
          }
        }

        setStep('done')
      } catch (error) {
        try {
          if (videoUrl) {
            await deleteStorageFile('best-plays', userId, `${userId}/${bestPlayId}/video.mp4`)
          }
          if (thumbnailUrl) {
            await deleteStorageFile('best-plays', userId, `${userId}/${bestPlayId}/thumbnail.jpg`)
          }
        } catch {
          // Cleanup failure is non-critical
        }
        throw error
      }
    },
    onSuccess: () => {
      const userId = session?.user?.id
      queryClient.invalidateQueries({ queryKey: ['best-plays', userId] })
      setTimeout(reset, 1500)
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Upload failed')
    },
  })
}

export function useDeleteBestPlay() {
  const queryClient = useQueryClient()
  const session = useAuthStore((s) => s.session)

  return useMutation({
    mutationFn: async (bestPlay: { id: string; user_id: string }) => {
      const userId = session?.user?.id
      if (!userId) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('best_plays')
        .delete()
        .eq('id', bestPlay.id)
        .eq('user_id', userId)

      if (error) {
        throw new Error('Failed to delete best play')
      }

      try {
        await deleteStorageFile('best-plays', userId, `${userId}/${bestPlay.id}/video.mp4`)
        await deleteStorageFile('best-plays', userId, `${userId}/${bestPlay.id}/thumbnail.jpg`)
      } catch {
        // Storage cleanup failure is non-critical
      }
    },
    onSuccess: () => {
      const userId = session?.user?.id
      queryClient.invalidateQueries({ queryKey: ['best-plays', userId] })
    },
  })
}
