import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { useAuthStore } from '@/stores/authStore'
import { useAuthInit } from '@/hooks/useAuthInit'
import { Spinner } from '@/components/ui/Spinner'
import { AuthStack } from './AuthStack'
import { MainTabs } from './MainTabs'

export function RootNavigator() {
  useAuthInit()

  const loading = useAuthStore((s) => s.loading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isProfileComplete = useAuthStore((s) => s.isProfileComplete)

  if (loading) {
    return <Spinner fullScreen />
  }

  return (
    <NavigationContainer>
      {isAuthenticated && isProfileComplete ? (
        <MainTabs />
      ) : isAuthenticated ? (
        <AuthStack initialRouteName="ProfileSetup" />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  )
}
