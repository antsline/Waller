import { supabase } from '@/lib/supabase'
import { uuidSchema } from '@/utils/validation'
import type { MoodType } from '@/types/models'

const LANDED_MOODS: readonly MoodType[] = ['landed', 'showcase']

function isLandedMood(mood: MoodType): boolean {
  return LANDED_MOODS.includes(mood)
}

async function findTricksWithOtherLandedClips(
  userId: string,
  clipId: string,
  trickIds: readonly string[],
): Promise<Set<string>> {
  const { data: otherClipTricks } = await supabase
    .from('clip_tricks')
    .select('trick_id, clip_id')
    .in('trick_id', [...trickIds])
    .neq('clip_id', clipId)

  if (!otherClipTricks || otherClipTricks.length === 0) {
    return new Set()
  }

  const otherClipIds = [...new Set(otherClipTricks.map((row) => row.clip_id))]

  const { data: landedClips } = await supabase
    .from('clips')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'published')
    .in('id', otherClipIds)
    .in('mood', [...LANDED_MOODS])

  if (!landedClips || landedClips.length === 0) {
    return new Set()
  }

  const landedClipIdSet = new Set(landedClips.map((c) => c.id))

  const tricksWithLandedClips = new Set<string>()
  for (const row of otherClipTricks) {
    if (landedClipIdSet.has(row.clip_id)) {
      tricksWithLandedClips.add(row.trick_id)
    }
  }

  return tricksWithLandedClips
}

export async function reevaluateUserTricksForClip(
  userId: string,
  clipId: string,
  oldTrickIds: readonly string[],
  oldMood: MoodType,
): Promise<void> {
  uuidSchema.parse(userId)
  uuidSchema.parse(clipId)

  if (!isLandedMood(oldMood) || oldTrickIds.length === 0) {
    return
  }

  const tricksWithOtherLanded = await findTricksWithOtherLandedClips(
    userId,
    clipId,
    oldTrickIds,
  )

  const tricksToDowngrade = oldTrickIds.filter(
    (id) => !tricksWithOtherLanded.has(id),
  )

  if (tricksToDowngrade.length === 0) {
    return
  }

  await supabase
    .from('user_tricks')
    .update({
      status: 'challenging',
      first_landed_at: null,
    })
    .eq('user_id', userId)
    .eq('status', 'landed')
    .in('trick_id', tricksToDowngrade)
}
