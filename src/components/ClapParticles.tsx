import React, { useEffect, useRef, memo } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { colors } from '@/constants/colors'

interface ClapParticlesProps {
  readonly trigger: number
}

const PARTICLE_COUNT = 6
const PARTICLE_SIZE = 4
const DURATION = 600

function createParticle() {
  const angle = Math.random() * Math.PI * 2
  const distance = 20 + Math.random() * 30
  return {
    translateX: Math.cos(angle) * distance,
    translateY: Math.sin(angle) * distance,
    opacity: new Animated.Value(1),
    scale: new Animated.Value(1),
    x: new Animated.Value(0),
    y: new Animated.Value(0),
  }
}

export const ClapParticles = memo(function ClapParticles({
  trigger,
}: ClapParticlesProps) {
  const particlesRef = useRef(
    Array.from({ length: PARTICLE_COUNT }, createParticle),
  )

  useEffect(() => {
    if (trigger === 0) return

    const particles = particlesRef.current

    particles.forEach((p) => {
      p.opacity.setValue(1)
      p.scale.setValue(1)
      p.x.setValue(0)
      p.y.setValue(0)

      const newAngle = Math.random() * Math.PI * 2
      const newDistance = 20 + Math.random() * 30
      const targetX = Math.cos(newAngle) * newDistance
      const targetY = Math.sin(newAngle) * newDistance

      Animated.parallel([
        Animated.timing(p.x, {
          toValue: targetX,
          duration: DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: targetY,
          duration: DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(p.scale, {
          toValue: 0.3,
          duration: DURATION,
          useNativeDriver: true,
        }),
      ]).start()
    })
  }, [trigger])

  if (trigger === 0) return null

  return (
    <View style={styles.container} pointerEvents="none">
      {particlesRef.current.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              opacity: p.opacity,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale },
              ],
            },
          ]}
        />
      ))}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    borderRadius: PARTICLE_SIZE / 2,
    backgroundColor: colors.accent,
  },
})
