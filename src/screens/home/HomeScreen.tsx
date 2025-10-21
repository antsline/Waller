import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MainTabScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';

type Props = MainTabScreenProps<'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ホームフィード</Text>
      <Text style={styles.subtitle}>ログイン中: {user?.email}</Text>
      <Text style={styles.info}>TODO: フィード実装予定</Text>

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>ログアウト</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  info: {
    fontSize: 16,
    color: '#999',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#FF6B00',
    padding: 16,
    borderRadius: 8,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
