import React, { memo } from 'react'
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Video } from 'lucide-react-native'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing, borderRadius } from '@/constants/spacing'

interface VideoPreviewProps {
  readonly thumbnailUri: string | null
  readonly duration: number | null
  readonly onPress: () => void
  readonly loading?: boolean
}

function formatDuration(
  ms: number | null,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (ms == null) return ''
  const seconds = Math.round(ms / 1000)
  return t('common.seconds_short', { count: seconds })
}

export const VideoPreview = memo(function VideoPreview({
  thumbnailUri,
  duration,
  onPress,
  loading = false,
}: VideoPreviewProps) {
  const { t } = useTranslation()

  if (!thumbnailUri) {
    return (
      <TouchableOpacity
        style={styles.emptyContainer}
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.7}
      >
        <Video size={48} color={colors.textSecondary} strokeWidth={1.5} />
        <Text style={styles.emptyText}>{t('clip.select_video')}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
      {duration != null && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(duration, t)}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  emptyContainer: {
    aspectRatio: 9 / 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.sub,
  },
  container: {
    aspectRatio: 9 / 16,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  durationText: {
    ...typography.subSmall,
    color: colors.white,
  },
})
