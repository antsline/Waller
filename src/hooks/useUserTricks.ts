import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Trick, UserTrick, TrickStatus } from '@/types/models'

export interface UserTrickWithDetails extends UserTrick {
  readonly trick: Pick<Trick, 'id' | 'name_original' | 'name_en' | 'name_ja' | 'category'>
}

interface UseUserTricksOptions {
  readonly userId: string
  readonly status?: TrickStatus
  readonly enabled?: boolean
}

async function fetchUserTricks(
  userId: string,
  status?: TrickStatus,
): Promise<readonly UserTrickWithDetails[]> {
  let query = supabase
    .from('user_tricks')
    .select('*, trick:tricks(id, name_original, name_en, name_ja, category)')
    .eq('user_id', userId)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) {
    throw new Error('Failed to fetch user tricks')
  }

  return (data ?? []) as readonly UserTrickWithDetails[]
}

export function useUserTricks(options: UseUserTricksOptions) {
  const { userId, status, enabled = true } = options

  return useQuery({
    queryKey: ['user-tricks', userId, status],
    queryFn: () => fetchUserTricks(userId, status),
    enabled: enabled && Boolean(userId),
    staleTime: 60_000,
  })
}
