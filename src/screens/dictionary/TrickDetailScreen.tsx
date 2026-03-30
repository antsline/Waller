import React, { useCallback } from 'react'
import { View, ScrollView, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { Clapperboard, Users } from 'lucide-react-native'
import type { DictionaryStackParamList } from '@/types/navigation'
import type { MainTabParamList } from '@/types/navigation'
import { useTrickDetail } from '@/hooks/useTrickDetail'
import { useTrickClips } from '@/hooks/useTrickClips'
import { useTrickPlayers } from '@/hooks/useTrickPlayers'
import { Tag } from '@/components/ui/Tag'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ClipThumbnailGrid } from '@/components/dictionary/ClipThumbnailGrid'
import { PlayerList } from '@/components/dictionary/PlayerList'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

type DetailRoute = RouteProp<DictionaryStackParamList, 'TrickDetail'>
type DetailNav = NativeStackNavigationProp<DictionaryStackParamList, 'TrickDetail'>

function getLocalizedSubname(
  nameOriginal: string,
  nameEn: string | null,
  nameJa: string | null,
  locale: string,
): string | null {
  const localized = locale === 'ja' ? nameJa : nameEn
  if (localized && localized !== nameOriginal) return localized
  const fallback = nameEn ?? nameJa
  if (fallback && fallback !== nameOriginal) return fallback
  return null
}

export function TrickDetailScreen() {
  const { t, i18n } = useTranslation()
  const route = useRoute<DetailRoute>()
  const navigation = useNavigation<DetailNav>()
  const { trickId } = route.params

  const { data: trick, isLoading, isError } = useTrickDetail(trickId)
  const { data: clips } = useTrickClips(trickId)
  const { data: players } = useTrickPlayers(trickId)

  const handlePressClip = useCallback(
    (clipId: string) => {
      navigation.navigate('ClipDetail', { clipId })
    },
    [navigation],
  )

  const handlePressPlayer = useCallback(
    (userId: string) => {
      navigation.getParent<NativeStackNavigationProp<MainTabParamList>>()
        ?.navigate('HomeTab', { screen: 'UserProfile', params: { userId } })
    },
    [navigation],
  )

  const handlePressCreator = useCallback(() => {
    if (trick?.creator) {
      navigation.getParent<NativeStackNavigationProp<MainTabParamList>>()
        ?.navigate('HomeTab', { screen: 'UserProfile', params: { userId: trick.creator.id } })
    }
  }, [trick, navigation])

  if (isLoading) {
    return <Spinner />
  }

  if (isError || !trick) {
    return (
      <EmptyState
        title={t('error.load_failed')}
        icon={<Clapperboard size={48} color={colors.textSecondary} />}
      />
    )
  }

  const subname = getLocalizedSubname(
    trick.name_original,
    trick.name_en,
    trick.name_ja,
    i18n.language,
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.nameOriginal}>{trick.name_original}</Text>
        {subname ? (
          <Text style={styles.nameLocalized}>{subname}</Text>
        ) : null}

        <Tag
          label={t(`dictionary.category_${trick.category}`)}
          accent
          style={styles.categoryTag}
        />

        {trick.creator ? (
          <Text
            style={styles.createdBy}
            onPress={handlePressCreator}
          >
            {t('dictionary.created_by')}: @{trick.creator.username}
          </Text>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Clapperboard size={18} color={colors.accent} strokeWidth={2} />
          <Text style={styles.statNumber}>{trick.clip_count}</Text>
          <Text style={styles.statLabel}>{t('dictionary.clip_count')}</Text>
        </View>
        <View style={styles.statItem}>
          <Users size={18} color={colors.accent} strokeWidth={2} />
          <Text style={styles.statNumber}>{trick.challenger_count}</Text>
          <Text style={styles.statLabel}>{t('dictionary.challenger_count')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dictionary.clips_section')}</Text>
        <ClipThumbnailGrid
          clips={clips ?? []}
          onPressClip={handlePressClip}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dictionary.players_section')}</Text>
        <PlayerList
          players={players ?? []}
          onPressPlayer={handlePressPlayer}
        />
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
    paddingBottom: spacing['4xl'],
  },
  header: {
    padding: spacing.lg,
  },
  nameOriginal: {
    ...typography.headingLarge,
  },
  nameLocalized: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  categoryTag: {
    marginTop: spacing.md,
  },
  createdBy: {
    ...typography.sub,
    marginTop: spacing.sm,
    color: colors.accent,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing['3xl'],
    marginBottom: spacing.xl,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statNumber: {
    ...typography.number,
  },
  statLabel: {
    ...typography.sub,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
})
