export const colors = {
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  border: '#E5E5E5',
  accent: '#FF5500',
  error: '#DC3545',
  success: '#28A745',
  white: '#FFFFFF',
  black: '#1A1A1A',
  transparent: 'transparent',
} as const

export type ColorKey = keyof typeof colors
