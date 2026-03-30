import React from 'react'
import {
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  useWindowDimensions,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

const NUM_COLUMNS = 3
const GAP = 2

interface ClipThumbnail {
  readonly id: string
  readonly thumbnail_url: string
}

interface ClipThumbnailGridProps {
  readonly clips: readonly ClipThumbnail[]
  readonly onPressClip: (clipId: string) => void
}

function ThumbnailItem({
  item,
  onPress,
  itemSize,
}: {
  readonly item: ClipThumbnail
  readonly onPress: () => void
  readonly itemSize: number
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{ width: itemSize, height: itemSize * (16 / 9) }}
    >
      <Image
        source={{ uri: item.thumbnail_url }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
    </TouchableOpacity>
  )
}

function keyExtractor(item: ClipThumbnail): string {
  return item.id
}

export function ClipThumbnailGrid({ clips, onPressClip }: ClipThumbnailGridProps) {
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const itemSize = (width - spacing.lg * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

  if (clips.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('dictionary.no_clips')}</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={clips}
      keyExtractor={keyExtractor}
      numColumns={NUM_COLUMNS}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <ThumbnailItem
          item={item}
          onPress={() => onPressClip(item.id)}
          itemSize={itemSize}
        />
      )}
    />
  )
}

const styles = StyleSheet.create({
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundSecondary,
  },
  empty: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.sub,
  },
})
