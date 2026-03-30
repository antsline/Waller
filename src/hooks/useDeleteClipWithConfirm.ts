import { useCallback } from 'react'
import { Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useDeleteClip } from '@/hooks/useDeleteClip'

export function useDeleteClipWithConfirm() {
  const { t } = useTranslation()
  const deleteClip = useDeleteClip()

  const confirmDelete = useCallback(
    (clipId: string, onSuccess?: () => void) => {
      Alert.alert(t('clip.delete_title'), t('clip.delete_confirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClip.mutateAsync({ clipId })
              onSuccess?.()
            } catch (error) {
              const message =
                error instanceof Error && error.message === 'delete_limit_reached'
                  ? t('clip.delete_limit_reached')
                  : t('error.generic')
              Alert.alert('', message)
            }
          },
        },
      ])
    },
    [deleteClip, t],
  )

  return { confirmDelete }
}
