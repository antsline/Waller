import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Trick, TrickCategory } from '@/types/models'

interface UseTricksOptions {
  readonly search?: string
  readonly category?: TrickCategory | null
  readonly enabled?: boolean
}

function escapePostgrestValue(value: string): string {
  const trimmed = value.slice(0, 100)
  return trimmed.replace(/[%_*,.()"'\\]/g, '\\$&')
}

async function fetchTricks(
  search?: string,
  category?: TrickCategory | null,
): Promise<Trick[]> {
  let query = supabase
    .from('tricks')
    .select('*')
    .order('clip_count', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  if (search && search.length > 0) {
    const escaped = escapePostgrestValue(search)
    query = query.or(
      `name_original.ilike.%${escaped}%,name_en.ilike.%${escaped}%,name_ja.ilike.%${escaped}%`,
    )
  }

  const { data, error } = await query.limit(50)

  if (error) {
    throw new Error('Failed to fetch tricks')
  }

  return data as Trick[]
}

export function useTricks(options: UseTricksOptions = {}) {
  const { search, category, enabled = true } = options

  return useQuery({
    queryKey: ['tricks', search, category],
    queryFn: () => fetchTricks(search, category),
    enabled,
    staleTime: 60_000,
  })
}
