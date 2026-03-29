import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function useAuthInit() {
  const setSession = useAuthStore((s) => s.setSession)
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)
  const clearSession = useAuthStore((s) => s.clearSession)

  useEffect(() => {
    let isMounted = true

    async function fetchProfile(userId: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!isMounted) return

      if (error && error.code !== 'PGRST116') {
        setUser(null)
        return
      }

      setUser(data ?? null)
    }

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) return

        if (session) {
          setSession(session)
          await fetchProfile(session.user.id)
        }
      } catch {
        // Session restore failed -- user will see login screen
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        if (event === 'SIGNED_OUT') {
          clearSession()
          return
        }

        if (session) {
          setSession(session)

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await fetchProfile(session.user.id)
          }
        }
      },
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setSession, setUser, setLoading, clearSession])
}
