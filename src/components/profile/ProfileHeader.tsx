import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ProfileStats } from './ProfileStats'
import { BestPlaySection } from './BestPlaySection'
import type { User, BestPlayWithTricks } from '@/types/models'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

interface ProfileHeaderProps {
  readonly user: User
  readonly stats: {
    readonly clipCount: number
    readonly clapTotal: number
    readonly tricksMastered: number
    readonly tricksChallenging: number
  }
  readonly bestPlays: readonly BestPlayWithTricks[]
  readonly isOwnProfile: boolean
  readonly onEditProfile?: () => void
  readonly onPressBestPlay: (bestPlay: BestPlayWithTricks) => void
  readonly onPressAddBestPlay?: (sortOrder: number) => void
}

export function ProfileHeader({
  user,
  stats,
  bestPlays,
  isOwnProfile,
  onEditProfile,
  onPressBestPlay,
  onPressAddBestPlay,
}: ProfileHeaderProps) {
  const { t } = useTranslation()

  const locationParts = [user.hometown, user.facility_tag].filter(Boolean)
  const locationText = locationParts.length > 0 ? locationParts.join(' / ') : null

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Avatar uri={user.avatar_url} size={80} />
        <Text style={styles.displayName}>{user.display_name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        {locationText ? (
          <Text style={styles.location}>{locationText}</Text>
        ) : null}
        {user.bio ? (
          <Text style={styles.bio}>{user.bio}</Text>
        ) : null}
        {isOwnProfile && onEditProfile ? (
          <Button
            title={t('profile.edit_profile')}
            variant="secondary"
            onPress={onEditProfile}
            style={styles.editButton}
          />
        ) : null}
      </View>

      <ProfileStats
        clipCount={stats.clipCount}
        clapTotal={stats.clapTotal}
        tricksMastered={stats.tricksMastered}
        tricksChallenging={stats.tricksChallenging}
      />

      <View style={styles.bestPlayContainer}>
        <BestPlaySection
          bestPlays={bestPlays}
          isOwnProfile={isOwnProfile}
          onPressBestPlay={onPressBestPlay}
          onPressAdd={onPressAddBestPlay}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  userInfo: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  displayName: {
    ...typography.heading,
    marginTop: spacing.sm,
  },
  username: {
    ...typography.sub,
  },
  location: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  bio: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  editButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    minWidth: 160,
  },
  bestPlayContainer: {
    paddingHorizontal: spacing.lg,
  },
})
