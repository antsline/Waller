import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { trickSchema } from '@/utils/validation'
import { useAuthStore } from '@/stores/authStore'
import type { Trick } from '@/types/models'
import type { TrickInput } from '@/utils/validation'

async function createTrick(
  input: TrickInput,
  userId: string,
): Promise<Trick> {
  const validated = trickSchema.parse(input)

  const { data, error } = await supabase
    .from('tricks')
    .insert({
      ...validated,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create trick')
  }

  return data as Trick
}

export function useCreateTrick() {
  const queryClient = useQueryClient()
  const session = useAuthStore((s) => s.session)

  return useMutation({
    mutationFn: (input: TrickInput) => {
      const userId = session?.user?.id
      if (!userId) {
        throw new Error('Not authenticated')
      }
      return createTrick(input, userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tricks'] })
    },
  })
}
