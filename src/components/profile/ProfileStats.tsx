import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '@/utils/formatNumber'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

interface ProfileStatsProps {
  readonly clipCount: number
  readonly clapTotal: number
  readonly tricksMastered: number
  readonly tricksChallenging: number
}

interface StatItemProps {
  readonly label: string
  readonly value: number
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{formatNumber(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export function ProfileStats({
  clipCount,
  clapTotal,
  tricksMastered,
  tricksChallenging,
}: ProfileStatsProps) {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <StatItem label={t('profile.clips_count')} value={clipCount} />
      <StatItem label={t('profile.claps_count')} value={clapTotal} />
      <StatItem label={t('profile.tricks_mastered')} value={tricksMastered} />
      <StatItem label={t('profile.tricks_challenging')} value={tricksChallenging} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.number,
  },
  statLabel: {
    ...typography.subSmall,
  },
})
