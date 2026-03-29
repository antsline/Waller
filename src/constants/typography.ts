import { Platform } from 'react-native'

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
    color: '#1A1A1A',
  },
  headingLarge: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: '#1A1A1A',
  },
  body: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400' as const,
    color: '#1A1A1A',
  },
  bodySmall: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#1A1A1A',
  },
  sub: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#6B6B6B',
  },
  subSmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#6B6B6B',
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
    color: '#1A1A1A',
  },
  number: {
    fontFamily,
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
} as const
