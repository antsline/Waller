import { Platform } from 'react-native'
import { colors } from './colors'

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
})

export const typography = {
  heading: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: colors.text,
  },
  headingLarge: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: colors.text,
  },
  body: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.text,
  },
  bodySmall: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.text,
  },
  sub: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  subSmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  button: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  label: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  number: {
    fontFamily,
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
} as const
