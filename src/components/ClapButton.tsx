import React, { useRef, useCallback, memo } from 'react'
import { View, Text, Image, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { ClapParticles } from '@/components/ClapParticles'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

interface ClapButtonProps {
  readonly totalClaps: number
  readonly isClapped: boolean
  readonly onClap: () => void
  readonly triggerCount: number
}

export const ClapButton = memo(function ClapButton({
  totalClaps,
  isClapped,
  onClap,
  triggerCount,
}: ClapButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 75,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 75,
        useNativeDriver: true,
      }),
    ]).start()

    onClap()
  }, [onClap, scaleAnim])

  const iconColor = isClapped ? colors.accent : colors.black

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.container}
    >
      <View style={styles.iconWrapper}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Image
            source={require('../../assets/clap-icon.png')}
            style={[styles.icon, { tintColor: isClapped ? colors.accent : colors.black }]}
          />
        </Animated.View>
        <ClapParticles trigger={triggerCount} />
      </View>
      {totalClaps > 0 && (
        <Text style={[styles.count, isClapped && styles.countActive]}>
          {totalClaps}
        </Text>
      )}
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  countActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  icon: {
    width: 24,
    height: 24,
  },
})
