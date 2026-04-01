import React from 'react'
import { Image } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import type { HomeStackParamList } from '@/types/navigation'
import { FeedScreen } from '@/screens/home/FeedScreen'
import { ClipDetailScreen } from '@/screens/home/ClipDetailScreen'
import { EditClipScreen } from '@/screens/clip/EditClipScreen'
import { UserProfileScreen } from '@/screens/home/UserProfileScreen'
import { colors } from '@/constants/colors'

const Stack = createNativeStackNavigator<HomeStackParamList>()

function HeaderLogo() {
  return (
    <Image
      source={require('../../assets/logo-header.png')}
      style={{ width: 100, height: 28 }}
      resizeMode="contain"
    />
  )
}

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
        options={{
          headerTitle: '',
          headerLeft: () => <HeaderLogo />,
        }}
      />
      <Stack.Screen
        name="ClipDetail"
        component={ClipDetailScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="EditClip"
        component={EditClipScreen}
        options={{ title: t('clip.edit_title') }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  )
}
