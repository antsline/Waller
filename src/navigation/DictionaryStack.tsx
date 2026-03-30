import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useTranslation } from 'react-i18next'
import type { DictionaryStackParamList } from '@/types/navigation'
import { TrickListScreen } from '@/screens/dictionary/TrickListScreen'
import { TrickDetailScreen } from '@/screens/dictionary/TrickDetailScreen'
import { NewTrickModal } from '@/screens/dictionary/NewTrickModal'
import { ClipDetailScreen } from '@/screens/home/ClipDetailScreen'
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
      <Stack.Screen
        name="TrickDetail"
        component={TrickDetailScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="NewTrickModal"
        component={NewTrickModal}
        options={{
          title: t('dictionary.register_title'),
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="ClipDetail"
        component={ClipDetailScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  )
}
