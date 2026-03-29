import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { MoodType } from '@/types/models'
import { Tag } from '@/components/ui/Tag'

interface MoodTagProps {
  readonly mood: MoodType
  readonly onPress?: () => void
}

export const MoodTag = memo(function MoodTag({ mood, onPress }: MoodTagProps) {
  const { t } = useTranslation()

  return (
    <Tag
      label={t(`mood.${mood}`)}
      accent={mood === 'landed'}
      onPress={onPress}
    />
  )
})
