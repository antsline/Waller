import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Clapperboard } from 'lucide-react-native'
import type { HomeStackParamList } from '@/types/navigation'
import type { FeedClip } from '@/types/models'
import { useClips } from '@/hooks/useClips'
import { useViewability } from '@/hooks/useViewability'
import { useClipMenu } from '@/hooks/useClipMenu'
import { useDeleteClipWithConfirm } from '@/hooks/useDeleteClipWithConfirm'
import { ClipCard } from '@/components/ClipCard'
import { ReportModal } from '@/components/ReportModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { colors } from '@/constants/colors'
import { spacing } from '@/constants/spacing'

type FeedNav = NativeStackNavigationProp<HomeStackParamList, 'Feed'>

export function FeedScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<FeedNav>()
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useClips()

  const { viewabilityConfig, onViewableItemsChanged, visibleIndex } =
    useViewability()

  const { showMenu } = useClipMenu()
  const { confirmDelete } = useDeleteClipWithConfirm()
  const [reportTargetId, setReportTargetId] = useState<string | null>(null)

  const clips = useMemo(() => data?.clips ?? [], [data?.clips])

  const clipsRef = useRef(clips)
  useEffect(() => {
    clipsRef.current = clips
  }, [clips])

  const handlePressUser = useCallback(
    (userId: string) => {
      navigation.navigate('UserProfile', { userId })
    },
    [navigation],
  )

  const handlePressClip = useCallback(
    (clipId: string) => {
      navigation.navigate('ClipDetail', { clipId })
    },
    [navigation],
  )

  const handleEdit = useCallback(
    (clipId: string) => {
      navigation.navigate('EditClip', { clipId })
    },
    [navigation],
  )

  const handleDelete = useCallback(
    (clipId: string) => {
      confirmDelete(clipId)
    },
    [confirmDelete],
  )

  const handlePressMenu = useCallback(
    (clipId: string) => {
      const clip = clipsRef.current.find((c) => c.id === clipId)
      if (clip) {
        showMenu(clipId, clip.user_id, {
          onEdit: handleEdit,
          onDelete: handleDelete,
          onReport: setReportTargetId,
        })
      }
    },
    [showMenu, handleEdit, handleDelete],
  )

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const visibleIndexRef = useRef(visibleIndex)
  visibleIndexRef.current = visibleIndex

  const renderItem = useCallback(
    ({ item, index }: { item: FeedClip; index: number }) => (
      <ClipCard
        clip={item}
        isVisible={index === visibleIndexRef.current}
        onPressUser={handlePressUser}
        onPressClip={handlePressClip}
        onPressMenu={handlePressMenu}
      />
    ),
    [handlePressUser, handlePressClip, handlePressMenu],
  )

  const keyExtractor = useCallback((item: FeedClip) => item.id, [])

  if (isLoading) {
    return <Spinner fullScreen />
  }

  if (isError) {
    return (
      <EmptyState
        title={t('error.load_failed')}
        subtitle={t('error.network')}
        action={
          <Button title={t('common.retry')} onPress={() => refetch()} />
        }
      />
    )
  }

  if (clips.length === 0) {
    return (
      <EmptyState
        icon={<Clapperboard size={48} color={colors.textSecondary} />}
        title={t('feed.empty')}
        subtitle={t('feed.empty_subtitle')}
      />
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={clips}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        extraData={visibleIndex}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged.current}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetch()}
            tintColor={colors.accent}
          />
        }
        windowSize={5}
        maxToRenderPerBatch={3}
        removeClippedSubviews
        ItemSeparatorComponent={Separator}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isFetchingNextPage ? <Spinner size="small" /> : null
        }
      />

      {reportTargetId && (
        <ReportModal
          visible={reportTargetId !== null}
          targetId={reportTargetId}
          targetType="clip"
          onClose={() => setReportTargetId(null)}
        />
      )}
    </View>
  )
}

function Separator() {
  return <View style={styles.separator} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  separator: {
    height: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
  },
})
