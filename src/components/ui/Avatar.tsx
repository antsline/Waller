import React from 'react'
import { View, Image, StyleSheet, type ImageStyle } from 'react-native'
import { User } from 'lucide-react-native'
import { colors } from '@/constants/colors'
import { borderRadius } from '@/constants/spacing'

interface AvatarProps {
  readonly uri: string | null | undefined
  readonly size?: number
  readonly style?: ImageStyle
}

export function Avatar({ uri, size = 40, style }: AvatarProps) {
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: borderRadius.full,
  }

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, containerStyle, style]}
      />
    )
  }

  return (
    <View style={[styles.placeholder, containerStyle, style]}>
      <User size={size * 0.5} color={colors.textSecondary} />
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.backgroundSecondary,
  },
  placeholder: {
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
