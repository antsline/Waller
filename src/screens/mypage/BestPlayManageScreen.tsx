import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { useBestPlays, useCreateBestPlay, useDeleteBestPlay } from '@/hooks/useBestPlays'
import { useVideoPicker } from '@/hooks/useVideoPicker'
import { useBestPlayUploadStore } from '@/stores/bestPlayUploadStore'
import { BestPlayCard } from '@/components/profile/BestPlayCard'
import { MoodSelector } from '@/components/MoodSelector'
import { TrickSelector } from '@/components/TrickSelector'
import { TextInput } from '@/components/ui/TextInput'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Toast } from '@/components/ui/Toast'
import { config } from '@/constants/config'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'
import type { BestPlayWithTricks, MoodType, TrickSummary } from '@/types/models'

type ManageMode = 'view' | 'add'

export function BestPlayManageScreen() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: bestPlays } = useBestPlays(user?.id)
  const createBestPlay = useCreateBestPlay()
  const deleteBestPlay = useDeleteBestPlay()
  const videoPicker = useVideoPicker('bestPlay')
  const uploadStep = useBestPlayUploadStore((s) => s.step)

  const [mode, setMode] = useState<ManageMode>('view')
  const [targetSortOrder, setTargetSortOrder] = useState(0)
  const [title, setTitle] = useState('')
  const [mood, setMood] = useState<MoodType | null>(null)
  const [selectedTricks, setSelectedTricks] = useState<readonly TrickSummary[]>([])
  const [facilityTag, setFacilityTag] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const resetForm = useCallback(() => {
    setMode('view')
    setTitle('')
    setMood(null)
    setSelectedTricks([])
    setFacilityTag('')
    videoPicker.clearVideo()
  }, [videoPicker])

  const handlePressAdd = useCallback(
    (sortOrder: number) => {
      setTargetSortOrder(sortOrder)
      setMode('add')
      videoPicker.pickVideo()
    },
    [videoPicker],
  )

  const handlePressBestPlay = useCallback(
    (bestPlay: BestPlayWithTricks) => {
      Alert.alert(bestPlay.title ?? 'Best Play', undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.best_play_replace'),
          onPress: () => {
            setTargetSortOrder(bestPlay.sort_order)
            deleteBestPlay.mutate(bestPlay, {
              onSuccess: () => {
                setMode('add')
                videoPicker.pickVideo()
              },
              onError: () => {
                setToastType('error')
                setToastMessage(t('error.generic'))
              },
            })
          },
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(t('profile.best_play_delete_confirm'), undefined, [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('common.delete'),
                style: 'destructive',
                onPress: () => {
                  deleteBestPlay.mutate(bestPlay, {
                    onError: () => {
                      setToastType('error')
                      setToastMessage(t('error.generic'))
                    },
                  })
                },
              },
            ])
          },
        },
      ])
    },
    [deleteBestPlay, videoPicker, t],
  )

  const canUpload =
    videoPicker.videoUri !== null &&
    videoPicker.thumbnailUri !== null &&
    !createBestPlay.isPending

  const handleUpload = useCallback(async () => {
    if (!videoPicker.videoUri || !videoPicker.thumbnailUri) return

    try {
      await createBestPlay.mutateAsync({
        videoUri: videoPicker.videoUri,
        thumbnailUri: videoPicker.thumbnailUri,
        videoDuration: videoPicker.duration ?? 0,
        videoSize: videoPicker.fileSize ?? 0,
        sortOrder: targetSortOrder,
        title: title.trim() || null,
        mood,
        facility_tag: facilityTag.trim() || null,
        trick_ids: selectedTricks.map((trick) => trick.id),
      })

      setToastType('success')
      setToastMessage(t('profile.best_play_upload_complete'))
      resetForm()
    } catch {
      setToastType('error')
      setToastMessage(t('error.upload_failed'))
    }
  }, [
    videoPicker,
    createBestPlay,
    targetSortOrder,
    title,
    mood,
    facilityTag,
    selectedTricks,
    resetForm,
    t,
  ])

  if (!user) {
    return <Spinner />
  }

  const slots = Array.from({ length: config.bestPlay.maxCount }, (_, i) => {
    return (bestPlays ?? []).find((bp) => bp.sort_order === i) ?? null
  })

  const uploadLabel = (() => {
    switch (uploadStep) {
      case 'video':
        return t('profile.best_play_upload_video')
      case 'thumbnail':
        return t('profile.best_play_upload_thumbnail')
      case 'saving':
        return t('profile.best_play_upload_saving')
      default:
        return t('profile.best_play_add')
    }
  })()

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>{t('profile.best_play')}</Text>

        <View style={styles.slotsRow}>
          {slots.map((bestPlay, index) => (
            <BestPlayCard
              key={bestPlay?.id ?? `slot-${index}`}
              bestPlay={bestPlay}
              onPress={() => {
                if (bestPlay) {
                  handlePressBestPlay(bestPlay)
                } else {
                  handlePressAdd(index)
                }
              }}
            />
          ))}
        </View>

        {mode === 'add' && videoPicker.videoUri ? (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>
              {t('profile.best_play_add')} (#{targetSortOrder + 1})
            </Text>

            {videoPicker.error ? (
              <Text style={styles.errorText}>{videoPicker.error}</Text>
            ) : null}

            <TextInput
              label={`${t('profile.best_play_title_placeholder')} (${t('common.optional')})`}
              value={title}
              onChangeText={setTitle}
              placeholder={t('profile.best_play_title_placeholder')}
              maxLength={config.bestPlay.maxTitleLength}
            />

            <MoodSelector selected={mood} onSelect={setMood} />

            <TrickSelector
              selectedTricks={selectedTricks}
              onTricksChange={setSelectedTricks}
            />

            <TextInput
              label={`${t('clip.facility_tag')} (${t('common.optional')})`}
              placeholder={t('clip.facility_placeholder')}
              value={facilityTag}
              onChangeText={setFacilityTag}
            />

            <Button
              title={createBestPlay.isPending ? uploadLabel : t('profile.best_play_add')}
              variant="accent"
              onPress={handleUpload}
              disabled={!canUpload}
              loading={createBestPlay.isPending}
            />

            <Button
              title={t('common.cancel')}
              variant="secondary"
              onPress={resetForm}
            />
          </View>
        ) : null}
      </ScrollView>

      <Toast
        message={toastMessage}
        visible={toastMessage !== ''}
        onHide={() => setToastMessage('')}
        type={toastType}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  sectionTitle: {
    ...typography.heading,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addForm: {
    gap: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingTop: spacing.xl,
  },
  formTitle: {
    ...typography.label,
  },
  errorText: {
    ...typography.subSmall,
    color: colors.error,
  },
})
