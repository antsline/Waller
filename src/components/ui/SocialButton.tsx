import React, { type ReactNode } from 'react'
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { borderRadius, spacing } from '@/constants/spacing'

interface SocialButtonProps {
  readonly title: string
  readonly onPress: () => void
  readonly icon: ReactNode
  readonly disabled?: boolean
  readonly loading?: boolean
  readonly style?: ViewStyle
}

export function SocialButton({
  title,
  onPress,
  icon,
  disabled = false,
  loading = false,
  style,
}: SocialButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[styles.button, disabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <View style={styles.content}>
          <View style={styles.icon}>{icon}</View>
          <Text style={styles.text}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.button,
    color: colors.white,
  },
  disabled: {
    opacity: 0.5,
  },
})
