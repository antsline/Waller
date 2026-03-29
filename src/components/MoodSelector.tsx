import React, { memo } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { MoodType } from '@/types/models'
import { Tag } from '@/components/ui/Tag'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

const MOODS: readonly MoodType[] = [
  'challenging',
  'landed',
  'training',
  'showcase',
  'first_time',
] as const

interface MoodSelectorProps {
  readonly selected: MoodType | null
  readonly onSelect: (mood: MoodType) => void
}

export const MoodSelector = memo(function MoodSelector({
  selected,
  onSelect,
}: MoodSelectorProps) {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('clip.select_mood')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MOODS.map((mood) => (
          <Tag
            key={mood}
            label={t(`mood.${mood}`)}
            selected={selected === mood}
            accent={selected === mood}
            onPress={() => onSelect(mood)}
            style={styles.tag}
          />
        ))}
      </ScrollView>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
  },
  scrollContent: {
    gap: spacing.sm,
  },
  tag: {
    marginRight: 0,
  },
})
