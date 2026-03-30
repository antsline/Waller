import React, { useCallback, useState } from 'react'
import { ScrollView, Alert, StyleSheet } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react-native'
import { useProfile } from '@/hooks/useProfile'
import { useUserStats } from '@/hooks/useUserStats'
import { useBestPlays } from '@/hooks/useBestPlays'
import { useReport } from '@/hooks/useReport'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { UserClipsGrid } from '@/components/profile/UserClipsGrid'
import { Spinner } from '@/components/ui/Spinner'
import { Toast } from '@/components/ui/Toast'
import type { HomeStackParamList } from '@/types/navigation'
import type { BestPlayWithTricks } from '@/types/models'
import { colors } from '@/constants/colors'
import { spacing } from '@/constants/spacing'

type RouteProps = RouteProp<HomeStackParamList, 'UserProfile'>
type Nav = NativeStackNavigationProp<HomeStackParamList, 'UserProfile'>

export function UserProfileScreen() {
  const { t } = useTranslation()
  const route = useRoute<RouteProps>()
  const navigation = useNavigation<Nav>()
  const { userId } = route.params

  const { profile, profileLoading } = useProfile(userId)
  const { data: stats } = useUserStats(userId)
  const { data: bestPlays } = useBestPlays(userId)
  const report = useReport()

  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const handlePressBestPlay = useCallback(
    (_bestPlay: BestPlayWithTricks) => {
      // Future: open best play viewer
    },
    [],
  )

  const handlePressClip = useCallback(
    (clipId: string) => {
      navigation.navigate('ClipDetail', { clipId })
    },
    [navigation],
  )

  const handleReport = useCallback(() => {
    Alert.alert(t('report.title'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('report.submit'),
        style: 'destructive',
        onPress: async () => {
          try {
            await report.mutateAsync({
              target_id: userId,
              target_type: 'user',
              reason: 'inappropriate',
            })
            setToastType('success')
            setToastMessage(t('report.success'))
          } catch (error) {
            const message =
              error instanceof Error && error.message === 'already_reported'
                ? t('report.already_reported')
                : t('error.generic')
            setToastType('error')
            setToastMessage(message)
          }
        },
      },
    ])
  }, [userId, report, t])

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        return (
          <MoreVertical
            size={20}
            color={colors.text}
            onPress={handleReport}
          />
        )
      },
    })
  }, [navigation, handleReport])

  if (profileLoading || !profile) {
    return <Spinner />
  }

  const defaultStats = {
    clipCount: 0,
    clapTotal: 0,
    tricksMastered: 0,
    tricksChallenging: 0,
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <ProfileHeader
          user={profile}
          stats={stats ?? defaultStats}
          bestPlays={bestPlays ?? []}
          isOwnProfile={false}
          onPressBestPlay={handlePressBestPlay}
        />

        <UserClipsGrid userId={userId} onPressClip={handlePressClip} />
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
    paddingTop: spacing.xl,
    paddingBottom: spacing['4xl'],
    gap: spacing.xl,
  },
})
