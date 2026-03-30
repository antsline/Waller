import { supabase } from '@/lib/supabase'
import { uuidSchema } from '@/utils/validation'
import type { FeedClip } from '@/types/models'

export async function fetchClipDetail(
  clipId: string,
  userId?: string,
): Promise<FeedClip> {
  const validatedId = uuidSchema.parse(clipId)

  const { data: rawData, error } = await supabase
    .from('clips')
    .select(
      `
      *,
      user:users!clips_user_id_fkey(id, username, display_name, avatar_url),
      counters:clip_counters!clip_counters_clip_id_fkey(clip_id, clap_count, clap_total, comment_count, updated_at),
      tricks:clip_tricks(trick:tricks(id, name_original, name_en, name_ja))
    `,
    )
    .eq('id', validatedId)
    .eq('status', 'published')
    .single()

  if (error) {
    throw new Error(`Failed to fetch clip: ${error.message}`)
  }

  const row = rawData as Record<string, unknown>

  const tricks = Array.isArray(row.tricks)
    ? (row.tricks as Record<string, unknown>[]).map((ct) => ct.trick).filter(Boolean)
    : []

  const userClap = userId
    ? await supabase
        .from('claps')
        .select('count')
        .eq('clip_id', validatedId)
        .eq('user_id', userId)
        .single()
        .then(({ data }) => (data ? { count: data.count } : null))
    : null

  return {
    ...row,
    counters: row.counters ?? {
      clip_id: row.id,
      clap_count: 0,
      clap_total: 0,
      comment_count: 0,
      updated_at: row.created_at,
    },
    tricks,
    user_clap: userClap,
  } as unknown as FeedClip
}
