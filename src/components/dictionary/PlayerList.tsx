import React from 'react'
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/ui/Avatar'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

interface Player {
  readonly id: string
  readonly username: string
  readonly display_name: string
  readonly avatar_url: string | null
}

interface PlayerListProps {
  readonly players: readonly Player[]
  readonly onPressPlayer: (userId: string) => void
}

function PlayerItem({
  item,
  onPress,
}: {
  readonly item: Player
  readonly onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.playerItem}
    >
      <Avatar uri={item.avatar_url} size={48} />
      <Text style={styles.playerName} numberOfLines={1}>
        {item.display_name}
      </Text>
      <Text style={styles.playerUsername} numberOfLines={1}>
        @{item.username}
      </Text>
    </TouchableOpacity>
  )
}

function keyExtractor(item: Player): string {
  return item.id
}

export function PlayerList({ players, onPressPlayer }: PlayerListProps) {
  const { t } = useTranslation()

  if (players.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('dictionary.no_players')}</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={players}
      keyExtractor={keyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <PlayerItem item={item} onPress={() => onPressPlayer(item.id)} />
      )}
    />
  )
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  playerItem: {
    alignItems: 'center',
    width: 72,
  },
  playerName: {
    ...typography.subSmall,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  playerUsername: {
    ...typography.subSmall,
    textAlign: 'center',
  },
  empty: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.sub,
  },
})
