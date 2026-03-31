import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import type { MyPageStackParamList } from '@/types/navigation'
import { MyPageScreen } from '@/screens/mypage/MyPageScreen'
import { EditProfileScreen } from '@/screens/mypage/EditProfileScreen'
import { BestPlayManageScreen } from '@/screens/mypage/BestPlayManageScreen'
import { SettingsScreen } from '@/screens/mypage/SettingsScreen'
import { WebViewScreen } from '@/screens/mypage/WebViewScreen'
import { colors } from '@/constants/colors'

const Stack = createNativeStackNavigator<MyPageStackParamList>()

export function MyPageStack() {
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
        name="MyPage"
        component={MyPageScreen}
        options={{ title: t('tabs.mypage') }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: t('profile.edit_profile') }}
      />
      <Stack.Screen
        name="BestPlayManage"
        component={BestPlayManageScreen}
        options={{ title: t('profile.best_play_manage') }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('settings.title') }}
      />
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </Stack.Navigator>
  )
}
