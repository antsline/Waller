import React, { memo } from 'react'
import { View, Text, Modal, StyleSheet, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useClipUploadStore } from '@/stores/clipUploadStore'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing, borderRadius } from '@/constants/spacing'

const STEP_KEYS: Record<string, string> = {
  video: 'clip.upload_video',
  thumbnail: 'clip.upload_thumbnail',
  saving: 'clip.upload_saving',
  done: 'clip.upload_complete',
}

export const UploadProgress = memo(function UploadProgress() {
  const { t } = useTranslation()
  const step = useClipUploadStore((s) => s.step)
  const error = useClipUploadStore((s) => s.error)

  const visible = step !== 'idle'
  const stepKey = STEP_KEYS[step]
  const message = error ?? (stepKey ? t(stepKey) : '')

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {step === 'error' ? (
            <Text style={styles.errorText}>{message}</Text>
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.message}>{message}</Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
})

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.lg,
    minWidth: 200,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
})
