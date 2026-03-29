import React from 'react'
import { useTranslation } from 'react-i18next'
import { Video } from 'lucide-react-native'
import { EmptyState } from '@/components/ui/EmptyState'
import { colors } from '@/constants/colors'

export function CreateClipScreen() {
  const { t } = useTranslation()

  return (
    <EmptyState
      icon={<Video size={48} color={colors.textSecondary} />}
      title={t('clip.select_video')}
    />
  )
}
