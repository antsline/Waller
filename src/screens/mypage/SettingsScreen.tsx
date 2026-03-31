import React, { useCallback, useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import Constants from 'expo-constants'
import {
  Globe,
  FileText,
  Shield,
  Trash2,
  LogOut,
  Info,
  ChevronRight,
} from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useLanguage } from '@/hooks/useLanguage'
import { useDeleteAccount } from '@/hooks/useDeleteAccount'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Toast } from '@/components/ui/Toast'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { borderRadius, spacing } from '@/constants/spacing'
import type { MyPageStackParamList } from '@/types/navigation'

type SettingsNav = NativeStackNavigationProp<MyPageStackParamList, 'Settings'>

const ICON_SIZE = 20

interface SettingsRowProps {
  readonly icon: React.ReactNode
  readonly label: string
  readonly value?: string
  readonly onPress: () => void
  readonly destructive?: boolean
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive = false,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        {icon}
        <Text
          style={[styles.rowLabel, destructive && styles.destructiveLabel]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {!destructive ? (
          <ChevronRight size={16} color={colors.textSecondary} />
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

function SectionHeader({ title }: { readonly title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>
}

export function SettingsScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<SettingsNav>()
  const clearSession = useAuthStore((s) => s.clearSession)
  const { locale, changeLocale } = useLanguage()
  const deleteAccount = useDeleteAccount()

  const [logoutModalVisible, setLogoutModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const appVersion =
    Constants.expoConfig?.version ?? '2.0.0'

  const handleLanguageToggle = useCallback(async () => {
    const nextLocale = locale === 'ja' ? 'en' : 'ja'
    try {
      await changeLocale(nextLocale)
    } catch {
      setToastMessage(t('error.generic'))
      setToastVisible(true)
    }
  }, [locale, changeLocale, t])

  const handleTerms = useCallback(() => {
    navigation.navigate('WebView', {
      uri: 'https://waller.app/terms',
      title: t('settings.terms'),
    })
  }, [navigation, t])

  const handlePrivacy = useCallback(() => {
    navigation.navigate('WebView', {
      uri: 'https://waller.app/privacy',
      title: t('settings.privacy'),
    })
  }, [navigation, t])

  const handleLogout = useCallback(async () => {
    setLogoutModalVisible(false)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      clearSession()
    } catch {
      setToastMessage(t('error.generic'))
      setToastVisible(true)
    }
  }, [clearSession, t])

  const handleDeleteAccount = useCallback(async () => {
    setDeleteModalVisible(false)
    try {
      await deleteAccount.mutateAsync()
    } catch {
      setToastMessage(t('error.generic'))
      setToastVisible(true)
    }
  }, [deleteAccount, t])

  const languageLabel =
    locale === 'ja' ? t('settings.language_ja') : t('settings.language_en')

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title={t('settings.title')} />

        <View style={styles.section}>
          <SettingsRow
            icon={<Globe size={ICON_SIZE} color={colors.text} />}
            label={t('settings.language')}
            value={languageLabel}
            onPress={handleLanguageToggle}
          />
        </View>

        <View style={styles.section}>
          <SettingsRow
            icon={<FileText size={ICON_SIZE} color={colors.text} />}
            label={t('settings.terms')}
            onPress={handleTerms}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon={<Shield size={ICON_SIZE} color={colors.text} />}
            label={t('settings.privacy')}
            onPress={handlePrivacy}
          />
        </View>

        <View style={styles.section}>
          <SettingsRow
            icon={<LogOut size={ICON_SIZE} color={colors.text} />}
            label={t('auth.sign_out')}
            onPress={() => setLogoutModalVisible(true)}
          />
        </View>

        <View style={styles.section}>
          <SettingsRow
            icon={<Trash2 size={ICON_SIZE} color={colors.error} />}
            label={t('settings.delete_account')}
            onPress={() => setDeleteModalVisible(true)}
            destructive
          />
        </View>

        <View style={styles.versionContainer}>
          <Info size={14} color={colors.textSecondary} />
          <Text style={styles.versionText}>
            {t('settings.version')} {appVersion}
          </Text>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={logoutModalVisible}
        title={t('auth.sign_out')}
        message={t('settings.logout_confirm')}
        confirmLabel={t('auth.sign_out')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />

      <ConfirmModal
        visible={deleteModalVisible}
        title={t('settings.delete_account')}
        message={t('settings.delete_account_confirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteModalVisible(false)}
        destructive
      />

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        type="error"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  sectionHeader: {
    ...typography.label,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  section: {
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.xl + ICON_SIZE + spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowLabel: {
    ...typography.body,
  },
  rowValue: {
    ...typography.body,
    color: colors.textSecondary,
  },
  destructiveLabel: {
    color: colors.error,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xl,
  },
  versionText: {
    ...typography.sub,
  },
})
