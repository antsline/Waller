import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { config } from '@/constants/config'
import type { Clip } from '@/types/models'

interface UserClipPage {
  readonly clips: readonly Clip[]
  readonly nextCursor: string | undefined
}

async function fetchUserClips(
  userId: string,
  cursor: string | undefined,
): Promise<UserClipPage> {
  const baseQuery = supabase
    .from('clips')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(config.feed.pageSize)

  const { data, error } = await (cursor ? baseQuery.lt('created_at', cursor) : baseQuery)

  if (error) {
    throw new Error('Failed to fetch user clips')
  }

  const clips = (data ?? []) as Clip[]

  return {
    clips,
    nextCursor:
      clips.length >= config.feed.pageSize
        ? clips[clips.length - 1].created_at
        : undefined,
  }
}

export function useUserClips(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['user-clips', userId],
    queryFn: ({ pageParam }) => fetchUserClips(userId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      clips: data.pages.flatMap((page) => page.clips),
    }),
  })
}
