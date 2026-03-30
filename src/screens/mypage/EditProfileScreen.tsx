import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
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

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged'

export function EditProfileScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const user = useAuthStore((s) => s.user)
  const {
    updateProfile,
    updateProfileLoading,
    updateUsername,
    updateUsernameLoading,
    checkUsernameAvailable,
  } = useProfile(user?.id)
  const { imageUri, pickImage } = useImagePicker()

  const [username, setUsername] = useState(user?.username ?? '')
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [hometown, setHometown] = useState(user?.hometown ?? '')
  const [facilityTag, setFacilityTag] = useState(user?.facility_tag ?? '')
  const [team, setTeam] = useState(user?.team ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('unchanged')
  const [toastMessage, setToastMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const canChangeUsername = (user?.username_change_count ?? 1) === 0
  const usernameChanged = username !== user?.username

  const debouncedUsername = useDebounce(username, 500)

  useEffect(() => {
    if (!canChangeUsername || !usernameChanged) {
      setUsernameStatus(usernameChanged ? 'idle' : 'unchanged')
      return
    }

    if (!debouncedUsername || debouncedUsername === user?.username) {
      setUsernameStatus('unchanged')
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
  }, [debouncedUsername, checkUsernameAvailable, canChangeUsername, usernameChanged, user?.username])

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

  const canSave =
    displayName.length > 0 &&
    !saving &&
    (usernameChanged ? usernameStatus === 'available' : true)

  const handleSave = useCallback(async () => {
    if (!user || !canSave) return

    const doSave = async () => {
      try {
        setSaving(true)

        const avatarUrl = imageUri
          ? await uploadAvatar(user.id, imageUri)
          : user.avatar_url

        await updateProfile({
          userId: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          hometown: hometown || null,
          facility_tag: facilityTag || null,
          team: team || null,
          bio: bio || null,
        })

        if (usernameChanged && canChangeUsername) {
          await updateUsername({
            userId: user.id,
            newUsername: username,
          })
        }

        navigation.goBack()
      } catch (error) {
        const message =
          error instanceof Error && error.message === 'username_taken'
            ? t('profile.username_taken')
            : error instanceof Error && error.message === 'username_change_limit'
              ? t('profile.username_change_limit')
              : t('error.profile_update_failed')
        setToastMessage(message)
      } finally {
        setSaving(false)
      }
    }

    if (usernameChanged && canChangeUsername) {
      Alert.alert(
        t('common.confirm'),
        t('profile.username_change_confirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.confirm'), onPress: doSave },
        ],
      )
    } else {
      await doSave()
    }
  }, [
    user,
    canSave,
    imageUri,
    displayName,
    hometown,
    facilityTag,
    team,
    bio,
    username,
    usernameChanged,
    canChangeUsername,
    updateProfile,
    updateUsername,
    navigation,
    t,
  ])

  if (!user) {
    return <Spinner />
  }

  const avatarDisplay = imageUri ?? user.avatar_url

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          <Avatar uri={avatarDisplay} size={96} />
          <View style={styles.cameraIcon}>
            <Camera size={16} color={colors.white} />
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          <View>
            <TextInput
              label={t('profile.username')}
              value={username}
              onChangeText={setUsername}
              placeholder={t('profile.username_placeholder')}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={config.profile.maxUsernameLength}
              editable={canChangeUsername}
              error={usernameError}
            />
            {canChangeUsername ? (
              <Text style={styles.warningText}>
                {t('profile.username_change_warning')}
              </Text>
            ) : (
              <Text style={styles.hintText}>
                {t('profile.username_change_limit')}
              </Text>
            )}
            {usernameStatus === 'checking' ? (
              <View style={styles.usernameHint}>
                <Spinner size="small" />
                <Text style={styles.hintText}>{t('profile.username_checking')}</Text>
              </View>
            ) : null}
            {usernameStatus === 'available' ? (
              <Text style={styles.availableText}>{t('profile.username_available')}</Text>
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
            maxLength={50}
          />

          <TextInput
            label={t('profile.team')}
            value={team}
            onChangeText={setTeam}
            placeholder={t('profile.team_placeholder')}
            maxLength={50}
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
            title={t('common.save')}
            onPress={handleSave}
            disabled={!canSave}
            loading={saving}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

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
    paddingVertical: spacing['2xl'],
    paddingBottom: spacing['4xl'],
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
  warningText: {
    ...typography.subSmall,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  hintText: {
    ...typography.subSmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  usernameHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
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
