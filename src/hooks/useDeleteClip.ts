import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uuidSchema } from '@/utils/validation'
import { useAuthStore } from '@/stores/authStore'
import { deleteStorageFile } from '@/services/storage'
import { reevaluateUserTricksForClip } from '@/services/userTricks'
import { config } from '@/constants/config'
import type { MoodType } from '@/types/models'

interface DeleteClipParams {
  readonly clipId: string
}

function getUtcTodayStart(): string {
  return new Date().toISOString().slice(0, 10) + 'T00:00:00Z'
}

async function executeDeleteClip(
  params: DeleteClipParams,
  userId: string,
): Promise<void> {
  const validatedClipId = uuidSchema.parse(params.clipId)

  const { data: clip, error: fetchError } = await supabase
    .from('clips')
    .select('id, user_id, video_url, thumbnail_url, created_at, mood')
    .eq('id', validatedClipId)
    .eq('user_id', userId)
    .eq('status', 'published')
    .single()

  if (fetchError || !clip) {
    throw new Error('Clip not found')
  }

  const { data: clipTricks } = await supabase
    .from('clip_tricks')
    .select('trick_id')
    .eq('clip_id', validatedClipId)

  const trickIds = (clipTricks ?? []).map((ct) => ct.trick_id)

  const clipAgeMs = Date.now() - new Date(clip.created_at).getTime()
  const freeWindowMs = config.deletion.freeWindowMinutes * 60 * 1000

  if (clipAgeMs > freeWindowMs) {
    const utcTodayStart = getUtcTodayStart()

    const { count, error: countError } = await supabase
      .from('deletion_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('deleted_at', utcTodayStart)

    if (countError) {
      throw new Error('Failed to check deletion limit')
    }

    if ((count ?? 0) >= config.deletion.maxDailyDeletes) {
      throw new Error('delete_limit_reached')
    }
  }

  const { error: updateError } = await supabase
    .from('clips')
    .update({ status: 'deleted' })
    .eq('id', validatedClipId)
    .eq('user_id', userId)

  if (updateError) {
    throw new Error('Failed to delete clip')
  }

  const { error: logError } = await supabase
    .from('deletion_logs')
    .insert({ user_id: userId, clip_id: validatedClipId })

  if (logError) {
    throw new Error('Failed to log deletion')
  }

  try {
    const videoPath = `${userId}/${validatedClipId}/video.mp4`
    const thumbnailPath = `${userId}/${validatedClipId}/thumbnail.jpg`
    await deleteStorageFile('clips', userId, videoPath)
    await deleteStorageFile('clips', userId, thumbnailPath)
  } catch (error) {
    console.warn('Storage cleanup failed:', validatedClipId, error)
  }

  if (trickIds.length > 0) {
    try {
      await reevaluateUserTricksForClip(
        userId,
        validatedClipId,
        trickIds,
        clip.mood as MoodType,
      )
    } catch (error) {
      console.warn('user_tricks re-evaluation failed:', validatedClipId, error)
    }
  }
}

export function useDeleteClip() {
  const queryClient = useQueryClient()
  const session = useAuthStore((s) => s.session)

  return useMutation({
    mutationFn: (params: DeleteClipParams) => {
      const userId = session?.user?.id
      if (!userId) {
        throw new Error('Not authenticated')
      }
      return executeDeleteClip(params, userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clips'] })
    },
  })
}
