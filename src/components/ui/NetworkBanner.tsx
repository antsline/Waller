import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { WifiOff } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

export function NetworkBanner() {
  const { t } = useTranslation()
  const { isOffline } = useNetworkStatus()

  if (!isOffline) return null

  return (
    <View style={styles.container}>
      <WifiOff size={14} color={colors.white} />
      <Text style={styles.text}>{t('error.offline')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  text: {
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
})
