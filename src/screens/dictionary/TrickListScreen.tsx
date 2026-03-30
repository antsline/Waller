import React, { useCallback, useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Search, Plus } from 'lucide-react-native'
import type { DictionaryStackParamList } from '@/types/navigation'
import type { Trick, TrickCategory } from '@/types/models'
import { useTricks } from '@/hooks/useTricks'
import { useDebounce } from '@/hooks/useDebounce'
import { TextInput } from '@/components/ui/TextInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { CategoryFilterBar } from '@/components/dictionary/CategoryFilterBar'
import { TrickCard } from '@/components/dictionary/TrickCard'
import { colors } from '@/constants/colors'
import { borderRadius, spacing } from '@/constants/spacing'

type DictionaryNav = NativeStackNavigationProp<DictionaryStackParamList, 'TrickList'>

function keyExtractor(item: Trick): string {
  return item.id
}

export function TrickListScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<DictionaryNav>()

  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TrickCategory | null>(null)

  const debouncedSearch = useDebounce(searchText, 300)
  const { data: tricks, isLoading, isError, refetch } = useTricks({
    search: debouncedSearch,
    category: selectedCategory,
  })

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('NewTrickModal')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  const handlePressTrick = useCallback(
    (trickId: string) => {
      navigation.navigate('TrickDetail', { trickId })
    },
    [navigation],
  )

  const renderItem = useCallback(
    ({ item }: { readonly item: Trick }) => (
      <TrickCard trick={item} onPress={() => handlePressTrick(item.id)} />
    ),
    [handlePressTrick],
  )

  if (isLoading) {
    return <Spinner />
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Search size={18} color={colors.textSecondary} strokeWidth={2} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t('dictionary.search_placeholder')}
            containerStyle={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>
      </View>

      <CategoryFilterBar
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <FlatList
        data={tricks ?? []}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        ListEmptyComponent={
          isError ? (
            <EmptyState
              title={t('error.load_failed')}
              icon={<Search size={48} color={colors.textSecondary} />}
            />
          ) : (
            <EmptyState
              title={t('dictionary.empty')}
              icon={<Search size={48} color={colors.textSecondary} />}
            />
          )
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingLeft: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing['4xl'],
  },
})
