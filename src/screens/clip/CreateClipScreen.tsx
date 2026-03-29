import React, { useState, useCallback } from 'react'
import { View, ScrollView, Text, StyleSheet, Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { MoodType, Trick } from '@/types/models'
import { useVideoPicker } from '@/hooks/useVideoPicker'
import { useCreateClip } from '@/hooks/useCreateClip'
import { VideoPreview } from '@/components/VideoPreview'
import { MoodSelector } from '@/components/MoodSelector'
import { TrickSelector } from '@/components/TrickSelector'
import { UploadProgress } from '@/components/UploadProgress'
import { TextInput } from '@/components/ui/TextInput'
import { Button } from '@/components/ui/Button'
import { config } from '@/constants/config'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

export function CreateClipScreen() {
  const { t } = useTranslation()
  const videoPicker = useVideoPicker('clip')
  const createClip = useCreateClip()

  const [mood, setMood] = useState<MoodType | null>(null)
  const [selectedTricks, setSelectedTricks] = useState<readonly Trick[]>([])
  const [facilityTag, setFacilityTag] = useState('')
  const [caption, setCaption] = useState('')

  const canPost =
    videoPicker.videoUri !== null &&
    videoPicker.thumbnailUri !== null &&
    mood !== null &&
    !createClip.isPending

  const handlePost = useCallback(async () => {
    if (!videoPicker.videoUri || !videoPicker.thumbnailUri || !mood) return

    try {
      await createClip.mutateAsync({
        videoUri: videoPicker.videoUri,
        thumbnailUri: videoPicker.thumbnailUri,
        videoDuration: videoPicker.duration ?? 0,
        videoSize: videoPicker.fileSize ?? 0,
        mood,
        caption: caption.trim() || null,
        facility_tag: facilityTag.trim() || null,
        trick_ids: selectedTricks.map((t) => t.id),
      })

      // Reset form
      videoPicker.clearVideo()
      setMood(null)
      setSelectedTricks([])
      setFacilityTag('')
      setCaption('')
    } catch {
      Alert.alert(t('error.generic'), t('error.upload_failed'))
    }
  }, [videoPicker, mood, caption, facilityTag, selectedTricks, createClip, t])

  const captionLength = caption.length

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <VideoPreview
          thumbnailUri={videoPicker.thumbnailUri}
          duration={videoPicker.duration}
          onPress={videoPicker.pickVideo}
          loading={videoPicker.loading}
        />

        {videoPicker.error && (
          <Text style={styles.errorText}>
            {t(`error.${videoPicker.error}`, { defaultValue: videoPicker.error })}
          </Text>
        )}

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

        <View>
          <TextInput
            label={`${t('clip.caption')} (${t('common.optional')})`}
            placeholder={t('clip.caption_placeholder')}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={config.clip.maxCaptionLength}
          />
          <Text style={styles.captionCount}>
            {captionLength}/{config.clip.maxCaptionLength}
          </Text>
        </View>

        <Button
          title={createClip.isPending ? t('clip.posting') : t('clip.post')}
          variant="accent"
          onPress={handlePost}
          disabled={!canPost}
          loading={createClip.isPending}
        />
      </ScrollView>

      <UploadProgress />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  errorText: {
    ...typography.subSmall,
    color: colors.error,
  },
  captionCount: {
    ...typography.subSmall,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
})
