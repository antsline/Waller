import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import type { HomeStackParamList } from '@/types/navigation'
import { FeedScreen } from '@/screens/home/FeedScreen'
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
    </Stack.Navigator>
  )
}
