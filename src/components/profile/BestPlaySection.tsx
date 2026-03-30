import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { BestPlayCard } from './BestPlayCard'
import type { BestPlayWithTricks } from '@/types/models'
import { config } from '@/constants/config'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

interface BestPlaySectionProps {
  readonly bestPlays: readonly BestPlayWithTricks[]
  readonly isOwnProfile: boolean
  readonly onPressBestPlay: (bestPlay: BestPlayWithTricks) => void
  readonly onPressAdd?: (sortOrder: number) => void
}

export function BestPlaySection({
  bestPlays,
  isOwnProfile,
  onPressBestPlay,
  onPressAdd,
}: BestPlaySectionProps) {
  const { t } = useTranslation()

  const slots = Array.from({ length: config.bestPlay.maxCount }, (_, i) => {
    return bestPlays.find((bp) => bp.sort_order === i) ?? null
  })

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('profile.best_play')}</Text>
      <View style={styles.row}>
        {slots.map((bestPlay, index) => (
          <BestPlayCard
            key={bestPlay?.id ?? `empty-${index}`}
            bestPlay={bestPlay}
            onPress={() => {
              if (bestPlay) {
                onPressBestPlay(bestPlay)
              } else if (isOwnProfile && onPressAdd) {
                onPressAdd(index)
              }
            }}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
})
