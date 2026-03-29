import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useTranslation } from 'react-i18next'
import { Home, BookOpen, PlusCircle, User } from 'lucide-react-native'
import type { MainTabParamList } from '@/types/navigation'
import { HomeStack } from './HomeStack'
import { DictionaryStack } from './DictionaryStack'
import { CreateClipScreen } from '@/screens/clip/CreateClipScreen'
import { MyPageStack } from './MyPageStack'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'

const Tab = createBottomTabNavigator<MainTabParamList>()

export function MainTabs() {
  const { t } = useTranslation()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.black,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        },
        tabBarLabelStyle: {
          fontSize: typography.subSmall.fontSize,
          fontWeight: typography.label.fontWeight,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="DictionaryTab"
        component={DictionaryStack}
        options={{
          title: t('tabs.dictionary'),
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="CreateClip"
        component={CreateClipScreen}
        options={{
          headerShown: true,
          headerTitle: t('clip.create_title'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          title: t('tabs.create'),
          tabBarIcon: ({ size }) => <PlusCircle size={size} color={colors.accent} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="MyPageTab"
        component={MyPageStack}
        options={{
          title: t('tabs.mypage'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tab.Navigator>
  )
}
