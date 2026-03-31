import React, { useCallback, useLayoutEffect } from 'react'
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Settings } from 'lucide-react-native'
import { useAuthStore } from '@/stores/authStore'
import { useUserStats } from '@/hooks/useUserStats'
import { useBestPlays } from '@/hooks/useBestPlays'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { UserClipsGrid } from '@/components/profile/UserClipsGrid'
import { Spinner } from '@/components/ui/Spinner'
import type { MyPageStackParamList } from '@/types/navigation'
import type { BestPlayWithTricks } from '@/types/models'
import { colors } from '@/constants/colors'
import { spacing } from '@/constants/spacing'

type MyPageNav = NativeStackNavigationProp<MyPageStackParamList, 'MyPage'>

export function MyPageScreen() {
  const navigation = useNavigation<MyPageNav>()
  const user = useAuthStore((s) => s.user)

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Settings size={22} color={colors.text} />
        </TouchableOpacity>
      ),
    })
  }, [navigation])
  const { data: stats } = useUserStats(user?.id)
  const { data: bestPlays } = useBestPlays(user?.id)

  const handleEditProfile = useCallback(() => {
    navigation.navigate('EditProfile')
  }, [navigation])

  const handlePressBestPlay = useCallback(
    (_bestPlay: BestPlayWithTricks) => {
      navigation.navigate('BestPlayManage')
    },
    [navigation],
  )

  const handlePressAddBestPlay = useCallback(
    (_sortOrder: number) => {
      navigation.navigate('BestPlayManage')
    },
    [navigation],
  )

  const handlePressClip = useCallback(
    (clipId: string) => {
      const parent = navigation.getParent()
      if (parent) {
        parent.navigate('HomeTab', {
          screen: 'ClipDetail',
          params: { clipId },
        })
      }
    },
    [navigation],
  )

  if (!user) {
    return <Spinner />
  }

  const defaultStats = {
    clipCount: 0,
    clapTotal: 0,
    tricksMastered: 0,
    tricksChallenging: 0,
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <ProfileHeader
        user={user}
        stats={stats ?? defaultStats}
        bestPlays={bestPlays ?? []}
        isOwnProfile
        onEditProfile={handleEditProfile}
        onPressBestPlay={handlePressBestPlay}
        onPressAddBestPlay={handlePressAddBestPlay}
      />

      <UserClipsGrid userId={user.id} onPressClip={handlePressClip} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.xl,
    paddingBottom: spacing['4xl'],
    gap: spacing.xl,
  },
})
