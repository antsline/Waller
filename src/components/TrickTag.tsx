import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TrickSummary } from '@/types/models'
import { Tag } from '@/components/ui/Tag'

interface TrickTagProps {
  readonly trick: TrickSummary
  readonly onPress?: () => void
}

function getTrickDisplayName(
  trick: TrickSummary,
  locale: string,
): string {
  if (locale === 'ja' && trick.name_ja) return trick.name_ja
  if (locale === 'en' && trick.name_en) return trick.name_en
  return trick.name_original
}

export const TrickTag = memo(function TrickTag({ trick, onPress }: TrickTagProps) {
  const { i18n } = useTranslation()
  const name = getTrickDisplayName(trick, i18n.language)

  return <Tag label={`#${name}`} onPress={onPress} />
})
