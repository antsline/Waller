import React, { memo, useState, useCallback, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react-native'
import { TRICK_CATEGORY_VALUES } from '@/types/models'
import type { TrickSummary, TrickCategory } from '@/types/models'
import { TextInput } from '@/components/ui/TextInput'
import { Tag } from '@/components/ui/Tag'
import { TrickTag } from '@/components/TrickTag'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useTricks } from '@/hooks/useTricks'
import { useCreateTrick } from '@/hooks/useCreateTrick'
import { useDebounce } from '@/hooks/useDebounce'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing, borderRadius } from '@/constants/spacing'

interface TrickSelectorProps {
  readonly selectedTricks: readonly TrickSummary[]
  readonly onTricksChange: (tricks: readonly TrickSummary[]) => void
}

const CATEGORIES = TRICK_CATEGORY_VALUES

export const TrickSelector = memo(function TrickSelector({
  selectedTricks,
  onTricksChange,
}: TrickSelectorProps) {
  const { t } = useTranslation()
  const [searchText, setSearchText] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [newTrickName, setNewTrickName] = useState('')
  const [newTrickCategory, setNewTrickCategory] = useState<TrickCategory>('other')
  const debouncedSearch = useDebounce(searchText, 300)

  const { data: tricks, isLoading } = useTricks({
    search: debouncedSearch,
    enabled: debouncedSearch.length > 0,
  })

  const createTrick = useCreateTrick()

  const handleSelect = useCallback(
    (trick: TrickSummary) => {
      const isSelected = selectedTricks.some((t) => t.id === trick.id)
      if (isSelected) {
        onTricksChange(selectedTricks.filter((t) => t.id !== trick.id))
      } else {
        onTricksChange([...selectedTricks, trick])
      }
    },
    [selectedTricks, onTricksChange],
  )

  const handleRemove = useCallback(
    (trickId: string) => {
      onTricksChange(selectedTricks.filter((t) => t.id !== trickId))
    },
    [selectedTricks, onTricksChange],
  )

  const handleRegister = useCallback(async () => {
    if (!newTrickName.trim()) return

    try {
      const trick = await createTrick.mutateAsync({
        name_original: newTrickName.trim(),
        category: newTrickCategory,
      })
      onTricksChange([...selectedTricks, trick])
      setNewTrickName('')
      setShowRegister(false)
    } catch {
      // Error handled by mutation
    }
  }, [newTrickName, newTrickCategory, createTrick, selectedTricks, onTricksChange])

  const selectedIds = useMemo(
    () => new Set(selectedTricks.map((t) => t.id)),
    [selectedTricks],
  )

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('clip.select_tricks')}</Text>

      {selectedTricks.length > 0 && (
        <View style={styles.selectedContainer}>
          {selectedTricks.map((trick) => (
            <TouchableOpacity
              key={trick.id}
              onPress={() => handleRemove(trick.id)}
              style={styles.selectedTag}
            >
              <TrickTag trick={trick} />
              <X size={12} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TextInput
        placeholder={t('clip.search_tricks')}
        value={searchText}
        onChangeText={setSearchText}
      />

      {isLoading && <Spinner size="small" />}

      {tricks && tricks.length > 0 && (
        <View style={styles.resultsList}>
          {tricks
            .filter((trick) => !selectedIds.has(trick.id))
            .slice(0, 10)
            .map((trick) => (
              <TouchableOpacity
                key={trick.id}
                onPress={() => handleSelect(trick)}
                style={styles.resultItem}
              >
                <Text style={styles.resultText}>{trick.name_original}</Text>
                <Text style={styles.resultSub}>
                  {t(`dictionary.category_${trick.category}`)}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}

      {debouncedSearch.length > 0 && tricks && tricks.length === 0 && !isLoading && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>{t('clip.no_tricks_found')}</Text>
          {!showRegister && (
            <TouchableOpacity
              onPress={() => {
                setShowRegister(true)
                setNewTrickName(searchText)
              }}
              style={styles.registerButton}
            >
              <Plus size={16} color={colors.accent} />
              <Text style={styles.registerButtonText}>{t('clip.register_trick')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {showRegister && (
        <View style={styles.registerForm}>
          <TextInput
            label={t('dictionary.name_original')}
            placeholder={t('dictionary.name_original_placeholder')}
            value={newTrickName}
            onChangeText={setNewTrickName}
          />
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Tag
                key={cat}
                label={t(`dictionary.category_${cat}`)}
                selected={newTrickCategory === cat}
                accent={newTrickCategory === cat}
                onPress={() => setNewTrickCategory(cat)}
              />
            ))}
          </View>
          <Button
            title={t('dictionary.register_new')}
            variant="accent"
            onPress={handleRegister}
            loading={createTrick.isPending}
            disabled={!newTrickName.trim()}
          />
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultsList: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  resultText: {
    ...typography.body,
  },
  resultSub: {
    ...typography.sub,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  noResultsText: {
    ...typography.sub,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  registerButtonText: {
    ...typography.body,
    color: colors.accent,
  },
  registerForm: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
})
