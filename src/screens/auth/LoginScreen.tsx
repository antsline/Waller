import React, { useCallback, useState } from 'react'
import { View, Text, Platform, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { useAuth } from '@/hooks/useAuth'
import { SocialButton } from '@/components/ui/SocialButton'
import { Toast } from '@/components/ui/Toast'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  )
}

function AppleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={colors.white}>
      <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </Svg>
  )
}

export function LoginScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { signInWithGoogle, signInWithApple } = useAuth()
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null)
  const [toastMessage, setToastMessage] = useState('')

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading('google')
      await signInWithGoogle()
    } catch {
      setToastMessage(t('error.generic'))
    } finally {
      setLoading(null)
    }
  }, [signInWithGoogle, t])

  const handleAppleSignIn = useCallback(async () => {
    try {
      setLoading('apple')
      await signInWithApple()
    } catch {
      setToastMessage(t('error.generic'))
    } finally {
      setLoading(null)
    }
  }, [signInWithApple, t])

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.login_title')}</Text>
        <Text style={styles.subtitle}>{t('auth.login_subtitle')}</Text>
      </View>

      <View style={styles.buttons}>
        <SocialButton
          title={t('auth.sign_in_google')}
          onPress={handleGoogleSignIn}
          icon={<GoogleIcon />}
          loading={loading === 'google'}
          disabled={loading !== null}
        />
        {Platform.OS === 'ios' ? (
          <SocialButton
            title={t('auth.sign_in_apple')}
            onPress={handleAppleSignIn}
            icon={<AppleIcon />}
            loading={loading === 'apple'}
            disabled={loading !== null}
          />
        ) : null}
      </View>

      <Toast
        message={toastMessage}
        visible={toastMessage !== ''}
        onHide={() => setToastMessage('')}
        type="error"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 2,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  buttons: {
    gap: spacing.md,
  },
})
