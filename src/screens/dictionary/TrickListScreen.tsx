import React from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen } from 'lucide-react-native'
import { EmptyState } from '@/components/ui/EmptyState'
import { colors } from '@/constants/colors'

export function TrickListScreen() {
  const { t } = useTranslation()

  return (
    <EmptyState
      icon={<BookOpen size={48} color={colors.textSecondary} />}
      title={t('dictionary.empty')}
    />
  )
}
