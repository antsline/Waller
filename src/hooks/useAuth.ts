import { useCallback } from 'react'
import { Platform } from 'react-native'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID

GoogleSignin.configure({
  webClientId: googleWebClientId,
  iosClientId: googleIosClientId,
})

export function useAuth() {
  const setSession = useAuthStore((s) => s.setSession)
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)
  const clearSession = useAuthStore((s) => s.clearSession)

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch profile: ${error.message}`)
      }

      setUser(data ?? null)
    },
    [setUser],
  )

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true)

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices()
      }

      const userInfo = await GoogleSignin.signIn()
      const idToken = userInfo.data?.idToken

      if (!idToken) {
        throw new Error('Failed to get Google ID token')
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.session) {
        setSession(data.session)
        await fetchProfile(data.session.user.id)
      }
    } catch (error) {
      clearSession()
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setSession, clearSession, fetchProfile])

  const signInWithApple = useCallback(async () => {
    try {
      setLoading(true)

      const rawNonce = Crypto.randomUUID()
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      )

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      })

      if (!credential.identityToken) {
        throw new Error('Failed to get Apple identity token')
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.session) {
        setSession(data.session)
        await fetchProfile(data.session.user.id)
      }
    } catch (error) {
      clearSession()
      throw error
    } finally {
      setLoading(false)
    }
  }, [setLoading, setSession, clearSession, fetchProfile])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      try {
        await GoogleSignin.revokeAccess()
      } catch {
        // Google revoke may fail silently if not signed in with Google
      }
    } finally {
      clearSession()
    }
  }, [clearSession])

  return {
    signInWithGoogle,
    signInWithApple,
    signOut,
    fetchProfile,
  }
}
