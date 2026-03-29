import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '@/types/navigation'
import { LoginScreen } from '@/screens/auth/LoginScreen'
import { ProfileSetupScreen } from '@/screens/auth/ProfileSetupScreen'

const Stack = createNativeStackNavigator<AuthStackParamList>()

interface AuthStackProps {
  readonly initialRouteName?: keyof AuthStackParamList
}

export function AuthStack({ initialRouteName = 'Login' }: AuthStackProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  )
}
