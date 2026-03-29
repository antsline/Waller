import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { colors } from '@/constants/colors'

interface SpinnerProps {
  readonly size?: 'small' | 'large'
  readonly color?: string
  readonly fullScreen?: boolean
}

export function Spinner({
  size = 'large',
  color = colors.text,
  fullScreen = false,
}: SpinnerProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
      </View>
    )
  }

  return <ActivityIndicator size={size} color={color} />
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})
