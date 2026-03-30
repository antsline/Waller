import React from 'react'
import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { Plus } from 'lucide-react-native'
import type { BestPlayWithTricks } from '@/types/models'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing, borderRadius } from '@/constants/spacing'

interface BestPlayCardProps {
  readonly bestPlay: BestPlayWithTricks | null
  readonly onPress: () => void
}

const CARD_WIDTH = 100
const CARD_HEIGHT = 140

export function BestPlayCard({ bestPlay, onPress }: BestPlayCardProps) {
  if (!bestPlay) {
    return (
      <Pressable style={styles.emptyCard} onPress={onPress}>
        <Plus size={24} color={colors.textSecondary} />
      </Pressable>
    )
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image
        source={{ uri: bestPlay.thumbnail_url }}
        style={styles.thumbnail}
      />
      {bestPlay.title ? (
        <View style={styles.titleOverlay}>
          <Text style={styles.titleText} numberOfLines={1}>
            {bestPlay.title}
          </Text>
        </View>
      ) : null}
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>
          {Math.round(bestPlay.video_duration)}s
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  emptyCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  titleText: {
    ...typography.subSmall,
    color: colors.white,
  },
  durationBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  durationText: {
    ...typography.subSmall,
    color: colors.white,
    fontSize: 10,
  },
})
