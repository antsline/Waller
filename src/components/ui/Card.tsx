import React, { type ReactNode } from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { colors } from '@/constants/colors'
import { borderRadius, spacing } from '@/constants/spacing'

interface CardProps {
  readonly children: ReactNode
  readonly style?: ViewStyle
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
})
