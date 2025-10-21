import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MainTabScreenProps } from '../../types/navigation';

type Props = MainTabScreenProps<'CreatePost'>;

export function CreatePostScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>投稿作成</Text>
      <Text style={styles.subtitle}>TODO: 実装予定</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});
