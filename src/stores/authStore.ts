import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { User } from '@/types/models'

interface AuthState {
  readonly session: Session | null
  readonly user: User | null
  readonly loading: boolean
  readonly isAuthenticated: boolean
  readonly isProfileComplete: boolean
}

interface AuthActions {
  readonly setSession: (session: Session | null) => void
  readonly setUser: (user: User | null) => void
  readonly setLoading: (loading: boolean) => void
  readonly setProfileComplete: (complete: boolean) => void
  readonly clearSession: () => void
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  session: null,
  user: null,
  loading: true,
  isAuthenticated: false,
  isProfileComplete: false,

  setSession: (session) =>
    set({
      session,
      isAuthenticated: session !== null,
    }),

  setUser: (user) =>
    set({
      user,
      isProfileComplete:
        user !== null &&
        user.username !== '' &&
        user.display_name !== '',
    }),

  setLoading: (loading) => set({ loading }),

  setProfileComplete: (complete) => set({ isProfileComplete: complete }),

  clearSession: () =>
    set({
      session: null,
      user: null,
      loading: false,
      isAuthenticated: false,
      isProfileComplete: false,
    }),
}))
