import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyPageScreen } from '../screens/profile/MyPageScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { WebViewScreen } from '../screens/common/WebViewScreen';
import { PostDetailScreen } from '../screens/post/PostDetailScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { MyPageStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<MyPageStackParamList>();

export function MyPageStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MyPageProfile" component={MyPageScreen} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}
