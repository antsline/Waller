import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackScreenProps, MyPageStackScreenProps } from '../../types/navigation';
import { ProfileScreen } from './ProfileScreen';

type Props = HomeStackScreenProps<'UserProfile'> | MyPageStackScreenProps<'UserProfile'>;

export function UserProfileScreen({ route, navigation }: Props) {
  const { userId } = route.params;

  // 他のユーザーのプロフィールを表示
  // ヘッダーの左側に戻るボタンを表示するため、navigationをProfileScreenに渡す
  return (
    <ProfileScreen
      userId={userId}
      showBackButton
      onBackPress={() => navigation.goBack()}
      onPostPress={(postId) => {
        navigation.navigate('PostDetail', { postId });
      }}
    />
  );
}
