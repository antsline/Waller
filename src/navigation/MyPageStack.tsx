import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import type { MyPageStackParamList } from '@/types/navigation'
import { MyPageScreen } from '@/screens/mypage/MyPageScreen'
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
    </Stack.Navigator>
  )
}
