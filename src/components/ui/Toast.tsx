import React, { useEffect, useRef } from 'react'
import { Animated, Text, StyleSheet } from 'react-native'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { borderRadius, spacing } from '@/constants/spacing'

interface ToastProps {
  readonly message: string
  readonly visible: boolean
  readonly onHide: () => void
  readonly duration?: number
  readonly type?: 'default' | 'error' | 'success'
}

export function Toast({
  message,
  visible,
  onHide,
  duration = 3000,
  type = 'default',
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      const animation = Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
      animation.start(() => onHide())
      return () => animation.stop()
    }
    return undefined
  }, [visible, duration, onHide, opacity])

  if (!visible) return null

  const bgColor =
    type === 'error'
      ? colors.error
      : type === 'success'
        ? colors.success
        : colors.black

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: bgColor }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: spacing.xl,
    right: spacing.xl,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    ...typography.body,
    color: colors.white,
  },
})
