import { useCallback } from 'react'
import { ActionSheetIOS, Platform, Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'

interface ClipMenuHandlers {
  readonly onEdit?: (clipId: string) => void
  readonly onDelete?: (clipId: string) => void
  readonly onReport?: (clipId: string) => void
}

export function useClipMenu() {
  const { t } = useTranslation()
  const session = useAuthStore((s) => s.session)
  const currentUserId = session?.user?.id

  const showMenu = useCallback(
    (clipId: string, clipUserId: string, handlers: ClipMenuHandlers) => {
      const isOwner = currentUserId === clipUserId

      if (Platform.OS === 'ios') {
        const options = isOwner
          ? [t('common.edit'), t('common.delete'), t('common.cancel')]
          : [t('report.title'), t('common.cancel')]

        const cancelButtonIndex = options.length - 1
        const destructiveButtonIndex = isOwner ? 1 : undefined

        ActionSheetIOS.showActionSheetWithOptions(
          { options, cancelButtonIndex, destructiveButtonIndex },
          (buttonIndex) => {
            if (isOwner) {
              if (buttonIndex === 0) handlers.onEdit?.(clipId)
              if (buttonIndex === 1) handlers.onDelete?.(clipId)
            } else {
              if (buttonIndex === 0) handlers.onReport?.(clipId)
            }
          },
        )
      } else {
        const buttons = isOwner
          ? [
              { text: t('common.edit'), onPress: () => handlers.onEdit?.(clipId) },
              {
                text: t('common.delete'),
                onPress: () => handlers.onDelete?.(clipId),
                style: 'destructive' as const,
              },
              { text: t('common.cancel'), style: 'cancel' as const },
            ]
          : [
              { text: t('report.title'), onPress: () => handlers.onReport?.(clipId) },
              { text: t('common.cancel'), style: 'cancel' as const },
            ]

        Alert.alert('', '', buttons)
      }
    },
    [currentUserId, t],
  )

  return { showMenu }
}
