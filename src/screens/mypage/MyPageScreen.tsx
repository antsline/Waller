import React, { useCallback, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { colors } from '@/constants/colors'
import { spacing } from '@/constants/spacing'

export function MyPageScreen() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const handleSignOut = useCallback(async () => {
    try {
      setLoading(true)
      await signOut()
    } catch {
      setToastMessage(t('error.generic'))
    } finally {
      setLoading(false)
    }
  }, [signOut, t])

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Avatar uri={user?.avatar_url} size={80} />
        <Button
          title={t('auth.sign_out')}
          onPress={handleSignOut}
          variant="secondary"
          loading={loading}
          style={styles.signOutButton}
        />
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
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
    gap: spacing.xl,
  },
  signOutButton: {
    width: '100%',
  },
})
