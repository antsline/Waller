import React from 'react';
import { MyPageStackScreenProps } from '../../types/navigation';
import { ProfileScreen } from './ProfileScreen';

type Props = MyPageStackScreenProps<'MyPageProfile'>;

export function MyPageScreen({ navigation }: Props) {
  // 自分のプロフィールを表示
  return (
    <ProfileScreen
      navigation={navigation}
      onPostPress={(postId) => {
        navigation.navigate('PostDetail', { postId });
      }}
    />
  );
}
