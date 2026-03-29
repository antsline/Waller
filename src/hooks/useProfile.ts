import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { profileSetupSchema, profileUpdateSchema } from '@/utils/validation'
import type { ProfileSetupInput, ProfileUpdateInput } from '@/utils/validation'
import type { User } from '@/types/models'
import i18n from '@/i18n'

export function useProfile(userId?: string) {
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<User | null> => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch profile: ${error.message}`)
      }

      return (data as User) ?? null
    },
    enabled: !!userId,
  })

  const createProfileMutation = useMutation({
    mutationFn: async (input: ProfileSetupInput & { id: string }) => {
      const validated = profileSetupSchema.parse(input)

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: input.id,
          username: validated.username,
          display_name: validated.display_name,
          avatar_url: validated.avatar_url ?? null,
          hometown: validated.hometown ?? null,
          facility_tag: validated.facility_tag ?? null,
          team: validated.team ?? null,
          bio: validated.bio ?? null,
          locale: i18n.language,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('username_taken')
        }
        throw new Error(`Failed to create profile: ${error.message}`)
      }

      return data as User
    },
    onSuccess: (data) => {
      setUser(data)
      queryClient.setQueryData(['profile', data.id], data)
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId: uid, ...input }: ProfileUpdateInput & { userId: string }) => {
      const validated = profileUpdateSchema.parse(input)

      const { data, error } = await supabase
        .from('users')
        .update(validated)
        .eq('id', uid)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`)
      }

      return data as User
    },
    onSuccess: (data) => {
      setUser(data)
      queryClient.setQueryData(['profile', data.id], data)
    },
  })

  const checkUsernameAvailable = useCallback(
    async (username: string): Promise<boolean> => {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle()

      return data === null
    },
    [],
  )

  return {
    profile: profileQuery.data ?? null,
    profileLoading: profileQuery.isLoading,
    profileError: profileQuery.error,
    createProfile: createProfileMutation.mutateAsync,
    createProfileLoading: createProfileMutation.isPending,
    updateProfile: updateProfileMutation.mutateAsync,
    updateProfileLoading: updateProfileMutation.isPending,
    checkUsernameAvailable,
  }
}
