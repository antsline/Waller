import React, { useCallback, useState } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { TextInput } from '@/components/ui/TextInput'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import { useCreateTrick } from '@/hooks/useCreateTrick'
import { trickSchema } from '@/utils/validation'
import { colors } from '@/constants/colors'
import { spacing } from '@/constants/spacing'
import type { TrickCategory } from '@/types/models'

const CATEGORIES: readonly TrickCategory[] = [
  'flip',
  'twist',
  'combo',
  'original',
  'other',
] as const

export function NewTrickModal() {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const createTrick = useCreateTrick()

  const [nameOriginal, setNameOriginal] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [category, setCategory] = useState<TrickCategory | null>(null)

  const canSubmit =
    nameOriginal.trim().length > 0 && category !== null && !createTrick.isPending

  const handleSubmit = useCallback(() => {
    if (!canSubmit || !category) return

    const result = trickSchema.safeParse({
      name_original: nameOriginal.trim(),
      name_en: nameEn.trim() || null,
      category,
    })

    if (!result.success) {
      Alert.alert(t('error.generic'))
      return
    }

    createTrick.mutate(result.data, {
      onSuccess: () => {
        Alert.alert(t('dictionary.register_success'))
        navigation.goBack()
      },
      onError: () => {
        Alert.alert(t('error.generic'))
      },
    })
  }, [canSubmit, category, nameOriginal, nameEn, createTrick, navigation, t])

  const handleCategorySelect = useCallback((cat: TrickCategory) => {
    setCategory((prev) => (prev === cat ? null : cat))
  }, [])

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          label={`${t('dictionary.name_original')} *`}
          value={nameOriginal}
          onChangeText={setNameOriginal}
          placeholder={t('dictionary.name_original_placeholder')}
          maxLength={100}
          autoFocus
        />

        <TextInput
          label={t('dictionary.name_en')}
          value={nameEn}
          onChangeText={setNameEn}
          placeholder={t('dictionary.name_en_placeholder')}
          maxLength={100}
          containerStyle={styles.field}
        />

        <View style={styles.field}>
          <TextInput label={`${t('dictionary.category')} *`} editable={false} value="" />
          <View style={styles.categories}>
            {CATEGORIES.map((cat) => (
              <Tag
                key={cat}
                label={t(`dictionary.category_${cat}`)}
                selected={category === cat}
                onPress={() => handleCategorySelect(cat)}
                style={styles.categoryTag}
              />
            ))}
          </View>
        </View>

        <Button
          title={t('dictionary.register_submit')}
          onPress={handleSubmit}
          variant="accent"
          disabled={!canSubmit}
          loading={createTrick.isPending}
          style={styles.submitButton}
        />
      </ScrollView>
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
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  field: {
    marginTop: spacing.lg,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  categoryTag: {
    marginBottom: spacing.xs,
  },
  submitButton: {
    marginTop: spacing['2xl'],
  },
})
