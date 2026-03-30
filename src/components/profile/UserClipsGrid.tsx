import React, { useCallback } from 'react'
import { View, FlatList, Image, Pressable, Text, StyleSheet, Dimensions } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useUserClips } from '@/hooks/useUserClips'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Clip } from '@/types/models'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

const NUM_COLUMNS = 3
const GAP = 2
const SCREEN_WIDTH = Dimensions.get('window').width
const ITEM_SIZE = (SCREEN_WIDTH - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

interface UserClipsGridProps {
  readonly userId: string
  readonly onPressClip: (clipId: string) => void
}

export function UserClipsGrid({ userId, onPressClip }: UserClipsGridProps) {
  const { t } = useTranslation()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserClips(userId)

  const clips = data?.clips ?? []

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const renderItem = useCallback(
    ({ item }: { item: Clip }) => (
      <Pressable
        style={styles.gridItem}
        onPress={() => onPressClip(item.id)}
      >
        <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
      </Pressable>
    ),
    [onPressClip],
  )

  if (clips.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('profile.no_clips')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('profile.clips')}</Text>
      <FlatList
        data={clips}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
  },
  row: {
    gap: GAP,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: colors.backgroundSecondary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.sub,
  },
})
