import React, { useState, useCallback, useEffect } from 'react'
import { View, ScrollView, Text, Image, StyleSheet, Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { HomeStackParamList, HomeScreenProps } from '@/types/navigation'
import type { MoodType, TrickSummary } from '@/types/models'
import { useAuthStore } from '@/stores/authStore'
import { useEditClip } from '@/hooks/useEditClip'
import { fetchClipDetail } from '@/services/clip'
import { MoodSelector } from '@/components/MoodSelector'
import { TrickSelector } from '@/components/TrickSelector'
import { TextInput } from '@/components/ui/TextInput'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { config } from '@/constants/config'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'

type Props = HomeScreenProps<'EditClip'>

export function EditClipScreen({ route }: Props) {
  const { clipId } = route.params
  const { t } = useTranslation()
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
  const session = useAuthStore((s) => s.session)
  const editClip = useEditClip()

  const { data: clip, isLoading, isError, refetch } = useQuery({
    queryKey: ['clips', clipId],
    queryFn: () => fetchClipDetail(clipId, session?.user?.id),
  })

  const [mood, setMood] = useState<MoodType | null>(null)
  const [selectedTricks, setSelectedTricks] = useState<readonly TrickSummary[]>([])
  const [facilityTag, setFacilityTag] = useState('')
  const [caption, setCaption] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (clip && !initialized) {
      setMood(clip.mood)
      setSelectedTricks(clip.tricks)
      setFacilityTag(clip.facility_tag ?? '')
      setCaption(clip.caption ?? '')
      setInitialized(true)
    }
  }, [clip, initialized])

  const canSave = mood !== null && !editClip.isPending

  const handleSave = useCallback(async () => {
    if (!mood || !clip) return

    try {
      await editClip.mutateAsync({
        clipId,
        mood,
        caption: caption.trim() || null,
        facility_tag: facilityTag.trim() || null,
        trick_ids: selectedTricks.map((trick) => trick.id),
        oldMood: clip.mood,
        oldTrickIds: clip.tricks.map((trick) => trick.id),
      })

      navigation.goBack()
    } catch {
      Alert.alert(t('error.generic'), t('error.save_failed'))
    }
  }, [clip, clipId, mood, caption, facilityTag, selectedTricks, editClip, navigation, t])

  if (isLoading) {
    return <Spinner fullScreen />
  }

  if (isError || !clip) {
    return (
      <EmptyState
        title={t('error.load_failed')}
        action={<Button title={t('common.retry')} onPress={() => refetch()} />}
      />
    )
  }

  if (clip.user_id !== session?.user?.id) {
    return <EmptyState title={t('error.generic')} />
  }

  const captionLength = caption.length

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: clip.thumbnail_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <View style={styles.videoOverlay}>
            <Text style={styles.videoOverlayText}>
              {t('clip.video_not_editable')}
            </Text>
          </View>
        </View>

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
          title={t('common.save')}
          variant="accent"
          onPress={handleSave}
          disabled={!canSave}
          loading={editClip.isPending}
        />
      </ScrollView>
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
  thumbnailContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 9 / 16,
    maxHeight: 300,
    alignSelf: 'center',
    width: '60%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  videoOverlayText: {
    ...typography.subSmall,
    color: colors.white,
  },
  captionCount: {
    ...typography.subSmall,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
})
