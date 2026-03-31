import React, { memo, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { MoreHorizontal } from 'lucide-react-native'
import type { FeedClip } from '@/types/models'
import { ClipPlayer } from '@/components/ClipPlayer'
import { ClapButton } from '@/components/ClapButton'
import { MoodTag } from '@/components/MoodTag'
import { TrickTag } from '@/components/TrickTag'
import { Avatar } from '@/components/ui/Avatar'
import { useClap } from '@/hooks/useClap'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

interface ClipCardProps {
  readonly clip: FeedClip
  readonly isVisible: boolean
  readonly playerMode?: 'active' | 'ready' | 'thumbnail'
  readonly onPressUser: (userId: string) => void
  readonly onPressClip: (clipId: string) => void
  readonly onPressTrick?: (trickId: string) => void
  readonly onPressMenu?: (clipId: string) => void
}

export const ClipCard = memo(function ClipCard({
  clip,
  isVisible,
  playerMode,
  onPressUser,
  onPressClip,
  onPressTrick,
  onPressMenu,
}: ClipCardProps) {
  const clap = useClap({
    clipId: clip.id,
    initialUserClap: clip.user_clap?.count ?? 0,
    initialTotalClaps: clip.counters.clap_total,
  })

  const handlePressUser = useCallback(() => {
    onPressUser(clip.user.id)
  }, [clip.user.id, onPressUser])

  const handlePressClip = useCallback(() => {
    onPressClip(clip.id)
  }, [clip.id, onPressClip])

  const handlePressMenu = useCallback(() => {
    onPressMenu?.(clip.id)
  }, [clip.id, onPressMenu])

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handlePressUser}
          style={styles.userInfo}
          activeOpacity={0.7}
        >
          <Avatar uri={clip.user.avatar_url} size={32} />
          <Text style={styles.username}>@{clip.user.username}</Text>
        </TouchableOpacity>
        {clip.facility_tag && (
          <Text style={styles.facility} numberOfLines={1}>
            {clip.facility_tag}
          </Text>
        )}
      </View>

      {/* Video - full width */}
      <TouchableOpacity onPress={handlePressClip} activeOpacity={1}>
        <ClipPlayer
          videoUri={clip.video_url}
          thumbnailUri={clip.thumbnail_url}
          isVisible={isVisible}
          mode={playerMode}
        />
      </TouchableOpacity>

      {/* Tags */}
      <View style={styles.tagsRow}>
        <MoodTag mood={clip.mood} />
        {clip.tricks.map((trick) => (
          <TrickTag
            key={trick.id}
            trick={trick}
            onPress={onPressTrick ? () => onPressTrick(trick.id) : undefined}
          />
        ))}
      </View>

      {/* Caption */}
      {clip.caption && (
        <Text style={styles.caption} numberOfLines={2}>
          {clip.caption}
        </Text>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <ClapButton
          totalClaps={clap.totalClaps}
          isClapped={clap.isClapped}
          onClap={clap.handleClap}
          triggerCount={clap.triggerCount}
        />
        <TouchableOpacity onPress={handlePressMenu} activeOpacity={0.7}>
          <MoreHorizontal size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  username: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  facility: {
    ...typography.sub,
    maxWidth: 120,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  caption: {
    ...typography.body,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
})
