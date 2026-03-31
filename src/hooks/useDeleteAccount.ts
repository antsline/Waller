import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

interface RpcResult {
  readonly status: 'deleted' | 'error'
  readonly code?: string
}

async function executeDeleteAccount(): Promise<void> {
  const { data, error } = await supabase.rpc('delete_account')

  if (error) {
    throw new Error('Failed to delete account')
  }

  const result = data as RpcResult

  if (result.status === 'error') {
    throw new Error(result.code ?? 'Failed to delete account')
  }

  const { error: signOutError } = await supabase.auth.signOut()

  if (signOutError) {
    throw new Error('Failed to sign out')
  }
}

export function useDeleteAccount() {
  const session = useAuthStore((s) => s.session)
  const clearSession = useAuthStore((s) => s.clearSession)

  return useMutation({
    mutationFn: () => {
      if (!session?.user?.id) {
        throw new Error('Not authenticated')
      }
      return executeDeleteAccount()
    },
    onSuccess: () => {
      clearSession()
    },
  })
}
