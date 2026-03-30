import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uuidSchema } from '@/utils/validation'
import type { Trick, User } from '@/types/models'

export interface TrickWithCreator extends Trick {
  readonly creator: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'> | null
}

async function fetchTrickDetail(trickId: string): Promise<TrickWithCreator> {
  const validId = uuidSchema.parse(trickId)

  const { data, error } = await supabase
    .from('tricks')
    .select('*, creator:users!tricks_created_by_fkey(id, username, display_name, avatar_url)')
    .eq('id', validId)
    .single()

  if (error) {
    // Fallback: FK name may differ, try without join
    const { data: trick, error: fallbackError } = await supabase
      .from('tricks')
      .select('*')
      .eq('id', validId)
      .single()

    if (fallbackError) {
      throw new Error('Failed to fetch trick detail')
    }

    const trickData = trick as Trick

    if (trickData.created_by) {
      const { data: user } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url')
        .eq('id', trickData.created_by)
        .single()

      return {
        ...trickData,
        creator: user as Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'> | null,
      }
    }

    return { ...trickData, creator: null }
  }

  return data as TrickWithCreator
}

export function useTrickDetail(trickId: string) {
  return useQuery({
    queryKey: ['trick', trickId],
    queryFn: () => fetchTrickDetail(trickId),
    enabled: Boolean(trickId),
    staleTime: 60_000,
  })
}
