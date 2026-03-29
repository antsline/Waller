import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Camera } from 'lucide-react-native'
import { useAuthStore } from '@/stores/authStore'
import { useProfile } from '@/hooks/useProfile'
import { useImagePicker } from '@/hooks/useImagePicker'
import { useDebounce } from '@/hooks/useDebounce'
import { uploadAvatar } from '@/services/storage'
import { usernameSchema } from '@/utils/validation'
import { Avatar } from '@/components/ui/Avatar'
import { TextInput } from '@/components/ui/TextInput'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Toast } from '@/components/ui/Toast'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing, borderRadius } from '@/constants/spacing'
import { config } from '@/constants/config'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export function ProfileSetupScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const session = useAuthStore((s) => s.session)
  const { createProfile, createProfileLoading, checkUsernameAvailable } = useProfile()
  const { imageUri, error: imageError, pickImage, clearImage } = useImagePicker()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [hometown, setHometown] = useState('')
  const [facilityTag, setFacilityTag] = useState('')
  const [team, setTeam] = useState('')
  const [bio, setBio] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [toastMessage, setToastMessage] = useState('')

  const debouncedUsername = useDebounce(username, 500)

  useEffect(() => {
    if (!debouncedUsername) {
      setUsernameStatus('idle')
      return
    }

    const result = usernameSchema.safeParse(debouncedUsername)
    if (!result.success) {
      setUsernameStatus('invalid')
      return
    }

    let cancelled = false

    async function check() {
      setUsernameStatus('checking')
      try {
        const available = await checkUsernameAvailable(debouncedUsername)
        if (!cancelled) {
          setUsernameStatus(available ? 'available' : 'taken')
        }
      } catch {
        if (!cancelled) {
          setUsernameStatus('idle')
        }
      }
    }

    check()

    return () => {
      cancelled = true
    }
  }, [debouncedUsername, checkUsernameAvailable])

  const usernameError = (() => {
    switch (usernameStatus) {
      case 'invalid':
        return t('profile.username_invalid')
      case 'taken':
        return t('profile.username_taken')
      default:
        return undefined
    }
  })()

  const usernameHint = (() => {
    switch (usernameStatus) {
      case 'checking':
        return t('profile.username_checking')
      case 'available':
        return t('profile.username_available')
      default:
        return undefined
    }
  })()

  const canSubmit =
    username.length > 0 &&
    displayName.length > 0 &&
    usernameStatus === 'available' &&
    !createProfileLoading

  const handleSubmit = useCallback(async () => {
    if (!session?.user.id || !canSubmit) return

    try {
      let avatarUrl: string | null = null

      if (imageUri) {
        avatarUrl = await uploadAvatar(session.user.id, imageUri)
      }

      await createProfile({
        id: session.user.id,
        username,
        display_name: displayName,
        avatar_url: avatarUrl,
        hometown: hometown || null,
        facility_tag: facilityTag || null,
        team: team || null,
        bio: bio || null,
      })
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'username_taken'
          ? t('profile.username_taken')
          : t('error.generic')
      setToastMessage(message)
    }
  }, [
    session,
    canSubmit,
    imageUri,
    username,
    displayName,
    hometown,
    facilityTag,
    team,
    bio,
    createProfile,
    t,
  ])

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + spacing.xl }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t('profile.setup_title')}</Text>

        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          <Avatar uri={imageUri} size={96} />
          <View style={styles.cameraIcon}>
            <Camera size={16} color={colors.white} />
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          <View>
            <TextInput
              label={`${t('profile.username')} *`}
              value={username}
              onChangeText={setUsername}
              placeholder={t('profile.username_placeholder')}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={config.profile.maxUsernameLength}
              error={usernameError}
            />
            {usernameStatus === 'checking' ? (
              <View style={styles.usernameHint}>
                <Spinner size="small" />
                <Text style={styles.hintText}>{usernameHint}</Text>
              </View>
            ) : null}
            {usernameStatus === 'available' ? (
              <Text style={styles.availableText}>{usernameHint}</Text>
            ) : null}
          </View>

          <TextInput
            label={`${t('profile.display_name')} *`}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('profile.display_name_placeholder')}
            maxLength={config.profile.maxDisplayNameLength}
          />

          <TextInput
            label={t('profile.hometown')}
            value={hometown}
            onChangeText={setHometown}
            placeholder={t('profile.hometown_placeholder')}
            maxLength={config.profile.maxHometownLength}
          />

          <TextInput
            label={t('profile.facility')}
            value={facilityTag}
            onChangeText={setFacilityTag}
            placeholder={t('profile.facility_placeholder')}
          />

          <TextInput
            label={t('profile.team')}
            value={team}
            onChangeText={setTeam}
            placeholder={t('profile.team_placeholder')}
          />

          <View>
            <TextInput
              label={t('profile.bio')}
              value={bio}
              onChangeText={setBio}
              placeholder={t('profile.bio_placeholder')}
              multiline
              numberOfLines={4}
              maxLength={config.profile.maxBioLength}
            />
            <Text style={styles.charCount}>
              {bio.length}/{config.profile.maxBioLength}
            </Text>
          </View>

          <Button
            title={t('common.done')}
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={createProfileLoading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

      {imageError ? (
        <Toast
          message={t('error.upload_failed')}
          visible={imageError !== null}
          onHide={clearImage}
          type="error"
        />
      ) : null}
      <Toast
        message={toastMessage}
        visible={toastMessage !== ''}
        onHide={() => setToastMessage('')}
        type="error"
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing['3xl'],
    paddingBottom: spacing['4xl'],
  },
  title: {
    ...typography.headingLarge,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: spacing['2xl'],
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  usernameHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  hintText: {
    ...typography.subSmall,
    color: colors.textSecondary,
  },
  availableText: {
    ...typography.subSmall,
    color: colors.success,
    marginTop: spacing.xs,
  },
  charCount: {
    ...typography.subSmall,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
})
