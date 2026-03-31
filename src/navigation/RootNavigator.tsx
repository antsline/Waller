import React from 'react'
import { View, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { useAuthStore } from '@/stores/authStore'
import { useAuthInit } from '@/hooks/useAuthInit'
import { Spinner } from '@/components/ui/Spinner'
import { NetworkBanner } from '@/components/ui/NetworkBanner'
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
      <View style={styles.container}>
        {isAuthenticated && <NetworkBanner />}
        {isAuthenticated && isProfileComplete ? (
          <MainTabs />
        ) : isAuthenticated ? (
          <AuthStack initialRouteName="ProfileSetup" />
        ) : (
          <AuthStack />
        )}
      </View>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
