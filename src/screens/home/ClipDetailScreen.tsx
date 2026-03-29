import React, { useCallback } from 'react'
import { View, ScrollView, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import type { HomeStackParamList, HomeScreenProps } from '@/types/navigation'
import type { FeedClip } from '@/types/models'
import { useAuthStore } from '@/stores/authStore'
import { useClap } from '@/hooks/useClap'
import { useClipMenu } from '@/hooks/useClipMenu'
import { ClipPlayer } from '@/components/ClipPlayer'
import { ClapButton } from '@/components/ClapButton'
import { MoodTag } from '@/components/MoodTag'
import { TrickTag } from '@/components/TrickTag'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'
import { MoreHorizontal } from 'lucide-react-native'
import { TouchableOpacity } from 'react-native'

type Props = HomeScreenProps<'ClipDetail'>

const uuidSchema = z.string().uuid()

async function fetchClipDetail(
  clipId: string,
  userId?: string,
): Promise<FeedClip> {
  const validatedId = uuidSchema.parse(clipId)

  const { data: rawData, error } = await supabase
    .from('clips')
    .select(
      `
      *,
      user:users!clips_user_id_fkey(id, username, display_name, avatar_url),
      counters:clip_counters!clip_counters_clip_id_fkey(clip_id, clap_count, clap_total, comment_count, updated_at),
      tricks:clip_tricks(trick:tricks(id, name_original, name_en, name_ja))
    `,
    )
    .eq('id', validatedId)
    .eq('status', 'published')
    .single()

  if (error) {
    throw new Error(`Failed to fetch clip: ${error.message}`)
  }

  const row = rawData as Record<string, unknown>

  const tricks = Array.isArray(row.tricks)
    ? (row.tricks as Record<string, unknown>[]).map((ct) => ct.trick).filter(Boolean)
    : []

  let userClap = null
  if (userId) {
    const { data: clapData } = await supabase
      .from('claps')
      .select('count')
      .eq('clip_id', clipId)
      .eq('user_id', userId)
      .single()

    if (clapData) {
      userClap = { count: clapData.count }
    }
  }

  return {
    ...row,
    counters: row.counters ?? {
      clip_id: row.id,
      clap_count: 0,
      clap_total: 0,
      comment_count: 0,
      updated_at: row.created_at,
    },
    tricks,
    user_clap: userClap,
  } as unknown as FeedClip
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return new Date(dateStr).toLocaleDateString()
}

export function ClipDetailScreen({ route }: Props) {
  const { clipId } = route.params
  const { t } = useTranslation()
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
  const session = useAuthStore((s) => s.session)
  const { showMenu } = useClipMenu()

  const { data: clip, isLoading, isError, refetch } = useQuery({
    queryKey: ['clips', clipId],
    queryFn: () => fetchClipDetail(clipId, session?.user?.id),
  })

  const clap = useClap({
    clipId,
    initialUserClap: clip?.user_clap?.count ?? 0,
    initialTotalClaps: clip?.counters.clap_total ?? 0,
  })

  const handlePressUser = useCallback(() => {
    if (clip) {
      navigation.navigate('UserProfile', { userId: clip.user.id })
    }
  }, [clip, navigation])

  const handlePressMenu = useCallback(() => {
    if (clip) {
      showMenu(clip.id, clip.user_id, {})
    }
  }, [clip, showMenu])

  if (isLoading) {
    return <Spinner fullScreen />
  }

  if (isError || !clip) {
    return (
      <EmptyState
        title={t('error.load_failed')}
        action={<Button title={t('common.retry')} onPress={() => refetch()} />}
      />
    )
  }

  return (
    <ScrollView style={styles.container}>
      <ClipPlayer
        videoUri={clip.video_url}
        thumbnailUri={clip.thumbnail_url}
        isVisible
      />

      <View style={styles.content}>
        {/* User info */}
        <View style={styles.userRow}>
          <TouchableOpacity
            onPress={handlePressUser}
            style={styles.userInfo}
            activeOpacity={0.7}
          >
            <Avatar uri={clip.user.avatar_url} size={40} />
            <View>
              <Text style={styles.displayName}>{clip.user.display_name}</Text>
              <Text style={styles.username}>@{clip.user.username}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <Text style={styles.timeAgo}>
              {formatRelativeTime(clip.created_at)}
            </Text>
            <TouchableOpacity onPress={handlePressMenu} activeOpacity={0.7}>
              <MoreHorizontal size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          <MoodTag mood={clip.mood} />
          {clip.tricks.map((trick) => (
            <TrickTag key={trick.id} trick={trick} />
          ))}
        </View>

        {/* Facility */}
        {clip.facility_tag && (
          <Text style={styles.facility}>{clip.facility_tag}</Text>
        )}

        {/* Caption */}
        {clip.caption && <Text style={styles.caption}>{clip.caption}</Text>}

        {/* Clap */}
        <View style={styles.clapRow}>
          <ClapButton
            totalClaps={clap.totalClaps}
            isClapped={clap.isClapped}
            onClap={clap.handleClap}
            triggerCount={clap.triggerCount}
          />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  displayName: {
    ...typography.body,
    fontWeight: '600',
  },
  username: {
    ...typography.sub,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeAgo: {
    ...typography.sub,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  facility: {
    ...typography.sub,
  },
  caption: {
    ...typography.body,
    lineHeight: 22,
  },
  clapRow: {
    paddingTop: spacing.xs,
  },
})
