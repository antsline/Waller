import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/home/HomeScreen';
import { CreatePostScreen } from '../screens/post/CreatePostScreen';
import { MyPageScreen } from '../screens/profile/MyPageScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B00',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'ホーム',
          tabBarIcon: () => null, // TODO: アイコン追加
        }}
      />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          title: '投稿',
          tabBarIcon: () => null, // TODO: アイコン追加
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          title: 'マイページ',
          tabBarIcon: () => null, // TODO: アイコン追加
        }}
      />
    </Tab.Navigator>
  );
}
