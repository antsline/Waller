import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface UserStats {
  readonly clipCount: number
  readonly clapTotal: number
  readonly tricksMastered: number
  readonly tricksChallenging: number
}

async function fetchClapTotal(userId: string): Promise<number> {
  const { data: clipIds } = await supabase
    .from('clips')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'published')

  if (!clipIds || clipIds.length === 0) {
    return 0
  }

  const { data: counters } = await supabase
    .from('clip_counters')
    .select('clap_total')
    .in('clip_id', clipIds.map((c) => c.id))

  return (counters ?? []).reduce((sum, row) => sum + (row.clap_total ?? 0), 0)
}

async function fetchUserStats(userId: string): Promise<UserStats> {
  const [clipsResult, clapTotal, masteredResult, challengingResult] = await Promise.all([
    supabase
      .from('clips')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'published'),
    fetchClapTotal(userId),
    supabase
      .from('user_tricks')
      .select('trick_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'landed'),
    supabase
      .from('user_tricks')
      .select('trick_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'challenging'),
  ])

  if (clipsResult.error || masteredResult.error || challengingResult.error) {
    throw new Error('Failed to fetch user stats')
  }

  return {
    clipCount: clipsResult.count ?? 0,
    clapTotal,
    tricksMastered: masteredResult.count ?? 0,
    tricksChallenging: challengingResult.count ?? 0,
  }
}

export function useUserStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => fetchUserStats(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  })
}
