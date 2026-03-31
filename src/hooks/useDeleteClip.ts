import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uuidSchema } from '@/utils/validation'
import { useAuthStore } from '@/stores/authStore'
import { deleteStorageFile } from '@/services/storage'
import { reevaluateUserTricksForClip } from '@/services/userTricks'
import type { MoodType } from '@/types/models'

interface DeleteClipParams {
  readonly clipId: string
}

interface RpcResult {
  readonly status: 'deleted' | 'error'
  readonly code?: string
  readonly trick_ids?: readonly string[]
  readonly mood?: string
}

async function executeDeleteClip(
  params: DeleteClipParams,
  userId: string,
): Promise<void> {
  const validatedClipId = uuidSchema.parse(params.clipId)

  const { data, error } = await supabase.rpc('check_and_delete_clip', {
    p_clip_id: validatedClipId,
  })

  if (error) {
    throw new Error('Failed to delete clip')
  }

  const result = data as RpcResult

  if (result.status === 'error') {
    throw new Error(result.code ?? 'Failed to delete clip')
  }

  // Storage cleanup (best-effort, non-critical)
  try {
    const videoPath = `${userId}/${validatedClipId}/video.mp4`
    const thumbnailPath = `${userId}/${validatedClipId}/thumbnail.jpg`
    await deleteStorageFile('clips', userId, videoPath)
    await deleteStorageFile('clips', userId, thumbnailPath)
  } catch {
    // Storage cleanup failure is non-critical
  }

  // Re-evaluate user_tricks (best-effort)
  const trickIds = result.trick_ids ?? []
  if (trickIds.length > 0 && result.mood) {
    try {
      await reevaluateUserTricksForClip(
        userId,
        validatedClipId,
        [...trickIds],
        result.mood as MoodType,
      )
    } catch {
      // user_tricks re-evaluation failure is non-critical
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
