import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Tag } from '@/components/ui/Tag'
import { spacing } from '@/constants/spacing'
import type { TrickCategory } from '@/types/models'

interface CategoryFilterBarProps {
  readonly selectedCategory: TrickCategory | null
  readonly onSelect: (category: TrickCategory | null) => void
}

interface CategoryOption {
  readonly key: TrickCategory | null
  readonly labelKey: string
}

const CATEGORY_OPTIONS: readonly CategoryOption[] = [
  { key: null, labelKey: 'dictionary.category_all' },
  { key: 'flip', labelKey: 'dictionary.category_flip' },
  { key: 'twist', labelKey: 'dictionary.category_twist' },
  { key: 'combo', labelKey: 'dictionary.category_combo' },
  { key: 'original', labelKey: 'dictionary.category_original' },
  { key: 'other', labelKey: 'dictionary.category_other' },
] as const

export function CategoryFilterBar({ selectedCategory, onSelect }: CategoryFilterBarProps) {
  const { t } = useTranslation()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {CATEGORY_OPTIONS.map((option) => (
        <Tag
          key={option.labelKey}
          label={t(option.labelKey)}
          selected={selectedCategory === option.key}
          onPress={() => onSelect(option.key)}
          style={styles.tag}
        />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tag: {
    alignSelf: 'center' as const,
  },
})
