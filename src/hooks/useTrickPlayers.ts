import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uuidSchema } from '@/utils/validation'
import type { User } from '@/types/models'

export type TrickPlayer = Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>

async function fetchTrickPlayers(trickId: string): Promise<readonly TrickPlayer[]> {
  const validId = uuidSchema.parse(trickId)

  const { data: userTricks, error: utError } = await supabase
    .from('user_tricks')
    .select('user_id')
    .eq('trick_id', validId)
    .eq('status', 'landed')
    .limit(30)

  if (utError) {
    throw new Error('Failed to fetch trick players')
  }

  if (!userTricks || userTricks.length === 0) {
    return []
  }

  const userIds = userTricks.map((ut) => ut.user_id)

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds)

  if (usersError) {
    throw new Error('Failed to fetch players')
  }

  return (users ?? []) as readonly TrickPlayer[]
}

export function useTrickPlayers(trickId: string) {
  return useQuery({
    queryKey: ['trick-players', trickId],
    queryFn: () => fetchTrickPlayers(trickId),
    enabled: Boolean(trickId),
    staleTime: 60_000,
  })
}
