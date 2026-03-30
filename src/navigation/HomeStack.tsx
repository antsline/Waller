import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import type { HomeStackParamList } from '@/types/navigation'
import { FeedScreen } from '@/screens/home/FeedScreen'
import { ClipDetailScreen } from '@/screens/home/ClipDetailScreen'
import { UserProfileScreen } from '@/screens/home/UserProfileScreen'
import { colors } from '@/constants/colors'

const Stack = createNativeStackNavigator<HomeStackParamList>()

export function HomeStack() {
  const { t } = useTranslation()

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={{ title: t('feed.title') }}
      />
      <Stack.Screen
        name="ClipDetail"
        component={ClipDetailScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  )
}
