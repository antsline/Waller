import React from 'react'
import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { borderRadius, spacing } from '@/constants/spacing'

interface TagProps {
  readonly label: string
  readonly onPress?: () => void
  readonly selected?: boolean
  readonly accent?: boolean
  readonly style?: ViewStyle
}

export function Tag({
  label,
  onPress,
  selected = false,
  accent = false,
  style,
}: TagProps) {
  const isAccent = selected || accent

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.tag,
        isAccent ? styles.tagAccent : styles.tagDefault,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          isAccent ? styles.textAccent : styles.textDefault,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  tagDefault: {
    backgroundColor: colors.backgroundSecondary,
  },
  tagAccent: {
    backgroundColor: colors.accent,
  },
  text: {
    ...typography.subSmall,
    fontWeight: '600',
  },
  textDefault: {
    color: colors.text,
  },
  textAccent: {
    color: colors.white,
  },
})
