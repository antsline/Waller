import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uuidSchema, editClipInputSchema } from '@/utils/validation'
import { useAuthStore } from '@/stores/authStore'
import { reevaluateUserTricksForClip } from '@/services/userTricks'
import type { MoodType } from '@/types/models'

interface EditClipParams {
  readonly clipId: string
  readonly mood: MoodType
  readonly caption?: string | null
  readonly facility_tag?: string | null
  readonly trick_ids?: readonly string[]
  readonly oldMood: MoodType
  readonly oldTrickIds: readonly string[]
}

async function executeEditClip(
  params: EditClipParams,
  userId: string,
): Promise<void> {
  const validatedClipId = uuidSchema.parse(params.clipId)

  const { data: clip, error: fetchError } = await supabase
    .from('clips')
    .select('id')
    .eq('id', validatedClipId)
    .eq('user_id', userId)
    .eq('status', 'published')
    .single()

  if (fetchError || !clip) {
    throw new Error('Clip not found')
  }

  const validated = editClipInputSchema.parse({
    mood: params.mood,
    caption: params.caption,
    facility_tag: params.facility_tag,
    trick_ids: params.trick_ids,
  })

  const { error: updateError } = await supabase
    .from('clips')
    .update({
      mood: validated.mood,
      caption: validated.caption ?? null,
      facility_tag: validated.facility_tag ?? null,
    })
    .eq('id', validatedClipId)
    .eq('user_id', userId)
    .eq('status', 'published')

  if (updateError) {
    throw new Error('Failed to update clip')
  }

  const newTrickIds = validated.trick_ids ?? []
  const oldTrickIds = params.oldTrickIds

  const tricksChanged =
    newTrickIds.length !== oldTrickIds.length ||
    newTrickIds.some((id) => !oldTrickIds.includes(id))

  if (tricksChanged) {
    const { data, error: rpcError } = await supabase.rpc('replace_clip_tricks', {
      p_clip_id: validatedClipId,
      p_trick_ids: [...newTrickIds],
    })

    if (rpcError) {
      throw new Error('Failed to update trick tags')
    }

    const result = data as { status: string; code?: string }
    if (result.status === 'error') {
      throw new Error(result.code ?? 'Failed to update trick tags')
    }
  }

  const moodChanged = params.oldMood !== validated.mood
  const removedTrickIds = oldTrickIds.filter((id) => !newTrickIds.includes(id))

  if (moodChanged || removedTrickIds.length > 0) {
    const tricksToReevaluate = moodChanged ? oldTrickIds : removedTrickIds
    await reevaluateUserTricksForClip(
      userId,
      validatedClipId,
      tricksToReevaluate,
      params.oldMood,
    )
  }
}

export function useEditClip() {
  const queryClient = useQueryClient()
  const session = useAuthStore((s) => s.session)

  return useMutation({
    mutationFn: (params: EditClipParams) => {
      const userId = session?.user?.id
      if (!userId) {
        throw new Error('Not authenticated')
      }
      return executeEditClip(params, userId)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clips'] })
      queryClient.invalidateQueries({ queryKey: ['clips', variables.clipId] })
    },
  })
}
