import React from 'react'
import { useTranslation } from 'react-i18next'
import { Clapperboard } from 'lucide-react-native'
import { EmptyState } from '@/components/ui/EmptyState'
import { colors } from '@/constants/colors'

export function FeedScreen() {
  const { t } = useTranslation()

  return (
    <EmptyState
      icon={<Clapperboard size={48} color={colors.textSecondary} />}
      title={t('feed.empty')}
      subtitle={t('feed.empty_subtitle')}
    />
  )
}
