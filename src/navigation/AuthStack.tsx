import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RoleSelectionScreen } from '../screens/auth/RoleSelectionScreen';
import { PlayerProfileSetupScreen } from '../screens/auth/PlayerProfileSetupScreen';
import { FanProfileSetupScreen } from '../screens/auth/FanProfileSetupScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
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
