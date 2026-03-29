import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { config } from '@/constants/config'
import type { FeedClip } from '@/types/models'

interface ClipQueryResult {
  readonly clips: readonly FeedClip[]
  readonly nextCursor: string | undefined
}

async function fetchClips(
  cursor: string | undefined,
  userId: string | undefined,
): Promise<ClipQueryResult> {
  let query = supabase
    .from('clips')
    .select(
      `
      *,
      user:users!clips_user_id_fkey(id, username, display_name, avatar_url),
      counters:clip_counters!clip_counters_clip_id_fkey(clip_id, clap_count, clap_total, comment_count, updated_at),
      tricks:clip_tricks(trick:tricks(id, name_original, name_en, name_ja))
    `,
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(config.feed.pageSize)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('Failed to fetch clips')
  }

  const clips: FeedClip[] = (data ?? []).map((row: Record<string, unknown>) => {
    const tricks = Array.isArray(row.tricks)
      ? row.tricks.map((ct: Record<string, unknown>) => ct.trick).filter(Boolean)
      : []

    return {
      ...(row as Record<string, unknown>),
      user: row.user,
      counters: row.counters ?? {
        clip_id: row.id,
        clap_count: 0,
        clap_total: 0,
        comment_count: 0,
        updated_at: row.created_at,
      },
      tricks,
      user_clap: null,
    } as unknown as FeedClip
  })

  // Fetch user's claps for these clips
  if (userId && clips.length > 0) {
    const clipIds = clips.map((c) => c.id)
    const { data: claps } = await supabase
      .from('claps')
      .select('clip_id, count')
      .eq('user_id', userId)
      .in('clip_id', clipIds)

    if (claps) {
      const clapMap = new Map(claps.map((c) => [c.clip_id, { count: c.count }]))
      return {
        clips: clips.map((clip) => ({
          ...clip,
          user_clap: clapMap.get(clip.id) ?? null,
        })),
        nextCursor:
          clips.length >= config.feed.pageSize
            ? clips[clips.length - 1].created_at
            : undefined,
      }
    }
  }

  return {
    clips,
    nextCursor:
      clips.length >= config.feed.pageSize
        ? clips[clips.length - 1].created_at
        : undefined,
  }
}

export function useClips() {
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id

  return useInfiniteQuery({
    queryKey: ['clips', 'feed'],
    queryFn: ({ pageParam }) => fetchClips(pageParam, userId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      clips: data.pages.flatMap((page) => page.clips),
    }),
  })
}
