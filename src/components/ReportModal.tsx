import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { Circle, CheckCircle2 } from 'lucide-react-native'
import type { ReportReason, ReportTargetType } from '@/types/models'
import { useReport } from '@/hooks/useReport'
import { TextInput } from '@/components/ui/TextInput'
import { Button } from '@/components/ui/Button'
import { config } from '@/constants/config'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

const REPORT_REASONS: readonly ReportReason[] = [
  'inappropriate',
  'spam',
  'harassment',
  'impersonation',
  'other',
] as const

interface ReportModalProps {
  readonly visible: boolean
  readonly targetId: string
  readonly targetType: ReportTargetType
  readonly onClose: () => void
}

export function ReportModal({
  visible,
  targetId,
  targetType,
  onClose,
}: ReportModalProps) {
  const { t } = useTranslation()
  const report = useReport()

  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [detail, setDetail] = useState('')

  const resetForm = useCallback(() => {
    setSelectedReason(null)
    setDetail('')
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handleSubmit = useCallback(async () => {
    if (!selectedReason) return

    try {
      await report.mutateAsync({
        target_id: targetId,
        target_type: targetType,
        reason: selectedReason,
        detail: detail.trim() || null,
      })

      Alert.alert('', t('report.success'))
      handleClose()
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'already_reported'
          ? t('report.already_reported')
          : t('error.generic')
      Alert.alert('', message)
      handleClose()
    }
  }, [selectedReason, detail, targetId, targetType, report, t, handleClose])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('report.title')}</Text>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.closeButton}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reasons}>
          {REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason
            return (
              <TouchableOpacity
                key={reason}
                style={styles.reasonRow}
                onPress={() => setSelectedReason(reason)}
                activeOpacity={0.7}
              >
                {isSelected ? (
                  <CheckCircle2 size={22} color={colors.accent} />
                ) : (
                  <Circle size={22} color={colors.textSecondary} />
                )}
                <Text
                  style={[
                    styles.reasonText,
                    isSelected && styles.reasonTextSelected,
                  ]}
                >
                  {t(`report.reason_${reason}`)}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TextInput
          label={`${t('report.detail_placeholder')}`}
          placeholder={t('report.detail_placeholder')}
          value={detail}
          onChangeText={setDetail}
          multiline
          maxLength={config.report.maxDetailLength}
        />

        <View style={styles.footer}>
          <Button
            title={t('report.submit')}
            variant="accent"
            onPress={handleSubmit}
            disabled={!selectedReason || report.isPending}
            loading={report.isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading,
  },
  closeButton: {
    ...typography.body,
    color: colors.accent,
  },
  reasons: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  reasonText: {
    ...typography.body,
  },
  reasonTextSelected: {
    fontWeight: '600',
    color: colors.accent,
  },
  footer: {
    marginTop: spacing.xl,
  },
})
