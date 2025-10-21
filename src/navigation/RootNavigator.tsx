import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isProfileComplete, loading, userRole } = useAuth();

  console.log('🗺️ RootNavigator render:', {
    loading,
    isAuthenticated,
    isProfileComplete,
    userRole,
  });

  // ローディング中
  if (loading) {
    console.log('⏳ Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  const shouldShowMain = isAuthenticated && isProfileComplete;
  console.log('🎯 Navigation decision:', shouldShowMain ? 'Main' : 'Auth');

  // 認証状態が変わったらNavigatorを再マウント
  const navigationKey = `root-${shouldShowMain ? 'main' : 'auth'}-${userRole || 'none'}`;
  console.log('🔑 Navigation key:', navigationKey);

  return (
    <NavigationContainer key={navigationKey}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {shouldShowMain ? (
          // 認証済み & プロフィール完了 → メインアプリ
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          // 未認証 or プロフィール未完了 → 認証フロー
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
