import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TrickSummary } from '@/types/models'
import { getLocalizedTrickName } from '@/utils/trickName'
import { Tag } from '@/components/ui/Tag'

interface TrickTagProps {
  readonly trick: TrickSummary
  readonly onPress?: () => void
}

export const TrickTag = memo(function TrickTag({ trick, onPress }: TrickTagProps) {
  const { i18n } = useTranslation()
  const name = getLocalizedTrickName(trick, i18n.language)

  return <Tag label={`#${name}`} onPress={onPress} />
})
