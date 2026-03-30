import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Clapperboard, Users } from 'lucide-react-native'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { borderRadius, spacing } from '@/constants/spacing'
import type { Trick } from '@/types/models'

interface TrickCardProps {
  readonly trick: Trick
  readonly onPress: () => void
}

function getLocalizedName(trick: Trick, locale: string): string | null {
  if (locale === 'ja' && trick.name_ja) return trick.name_ja
  if (locale === 'en' && trick.name_en) return trick.name_en
  return trick.name_en ?? trick.name_ja ?? null
}

export function TrickCard({ trick, onPress }: TrickCardProps) {
  const { i18n, t } = useTranslation()
  const localizedName = getLocalizedName(trick, i18n.language)

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.nameSection}>
        <Text style={styles.nameOriginal} numberOfLines={1}>
          {trick.name_original}
        </Text>
        {localizedName && localizedName !== trick.name_original ? (
          <Text style={styles.nameLocalized} numberOfLines={1}>
            {localizedName}
          </Text>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Clapperboard size={14} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.statText}>
            {trick.clip_count} {t('dictionary.clip_count')}
          </Text>
        </View>
        <View style={styles.stat}>
          <Users size={14} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.statText}>
            {trick.challenger_count} {t('dictionary.challenger_count')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  nameSection: {
    marginBottom: spacing.sm,
  },
  nameOriginal: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  nameLocalized: {
    ...typography.sub,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.subSmall,
  },
})
