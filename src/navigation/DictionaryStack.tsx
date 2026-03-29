import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import type { DictionaryStackParamList } from '@/types/navigation'
import { TrickListScreen } from '@/screens/dictionary/TrickListScreen'
import { colors } from '@/constants/colors'

const Stack = createNativeStackNavigator<DictionaryStackParamList>()

export function DictionaryStack() {
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
        name="TrickList"
        component={TrickListScreen}
        options={{ title: t('dictionary.title') }}
      />
    </Stack.Navigator>
  )
}
