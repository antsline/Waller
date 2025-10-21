import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import { PlayerProfileSetupScreen } from '../screens/auth/PlayerProfileSetupScreen';
import { FanProfileSetupScreen } from '../screens/auth/FanProfileSetupScreen';
import { useAuth } from '../hooks/useAuth';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  const { isAuthenticated, userRole } = useAuth();

  // 初期画面を決定
  const getInitialRoute = (): keyof AuthStackParamList => {
    if (!isAuthenticated) {
      // 未認証 → ログイン画面
      console.log('🚪 AuthStack: Starting from Login (not authenticated)');
      return 'Login';
    }

    if (!userRole) {
      // 認証済みだがロール未設定 → ロール選択画面
      console.log('🚪 AuthStack: Starting from RoleSelection (no role)');
      return 'RoleSelection';
    }

    // 認証済み、ロール設定済みだがプロフィール未完了 → プロフィール設定画面
    if (userRole === 'player') {
      console.log('🚪 AuthStack: Starting from PlayerProfileSetup');
      return 'PlayerProfileSetup';
    } else {
      console.log('🚪 AuthStack: Starting from FanProfileSetup');
      return 'FanProfileSetup';
    }
  };

  const initialRoute = getInitialRoute();

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="PlayerProfileSetup" component={PlayerProfileSetupScreen} />
      <Stack.Screen name="FanProfileSetup" component={FanProfileSetupScreen} />
    </Stack.Navigator>
  );
}
