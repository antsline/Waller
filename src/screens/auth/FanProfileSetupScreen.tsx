import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';

type Props = AuthStackScreenProps<'FanProfileSetup'>;

export function FanProfileSetupScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ファンプロフィール設定</Text>
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
