import React from 'react'
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
} from 'react-native'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { borderRadius, spacing } from '@/constants/spacing'

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  readonly label?: string
  readonly error?: string
  readonly containerStyle?: ViewStyle
}

export function TextInput({
  label,
  error,
  containerStyle,
  ...props
}: TextInputProps) {
  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <RNTextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  error: {
    ...typography.subSmall,
    color: colors.error,
    marginTop: spacing.xs,
  },
})
