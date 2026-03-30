import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uuidSchema } from '@/utils/validation'

export interface TrickClip {
  readonly id: string
  readonly thumbnail_url: string
  readonly user_id: string
  readonly caption: string | null
  readonly created_at: string
}

async function fetchTrickClips(trickId: string): Promise<readonly TrickClip[]> {
  const validId = uuidSchema.parse(trickId)

  const { data: clipTricks, error: joinError } = await supabase
    .from('clip_tricks')
    .select('clip_id')
    .eq('trick_id', validId)
    .limit(30)

  if (joinError) {
    throw new Error('Failed to fetch trick clips')
  }

  if (!clipTricks || clipTricks.length === 0) {
    return []
  }

  const clipIds = clipTricks.map((ct) => ct.clip_id)

  const { data: clips, error: clipsError } = await supabase
    .from('clips')
    .select('id, thumbnail_url, user_id, caption, created_at')
    .in('id', clipIds)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (clipsError) {
    throw new Error('Failed to fetch clips')
  }

  return (clips ?? []) as readonly TrickClip[]
}

export function useTrickClips(trickId: string) {
  return useQuery({
    queryKey: ['trick-clips', trickId],
    queryFn: () => fetchTrickClips(trickId),
    enabled: Boolean(trickId),
    staleTime: 60_000,
  })
}
