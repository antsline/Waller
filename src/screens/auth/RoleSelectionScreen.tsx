import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';

type Props = AuthStackScreenProps<'RoleSelection'>;

export function RoleSelectionScreen({ navigation }: Props) {
  const [selectedRole, setSelectedRole] = useState<'player' | 'fan' | null>(null);

  const handleNext = () => {
    if (!selectedRole) return;

    if (selectedRole === 'player') {
      navigation.navigate('PlayerProfileSetup');
    } else {
      navigation.navigate('FanProfileSetup');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>あなたの立場を選択してください</Text>
      <Text style={styles.subtitle}>後から変更はできません</Text>

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleCard, selectedRole === 'player' && styles.roleCardSelected]}
          onPress={() => setSelectedRole('player')}
        >
          <View style={styles.radioButton}>
            {selectedRole === 'player' && <View style={styles.radioButtonInner} />}
          </View>
          <Text style={styles.roleTitle}>プレーヤー</Text>
          <Text style={styles.roleDescription}>
            自分の技や挑戦を記録・共有したい競技者
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, selectedRole === 'fan' && styles.roleCardSelected]}
          onPress={() => setSelectedRole('fan')}
        >
          <View style={styles.radioButton}>
            {selectedRole === 'fan' && <View style={styles.radioButtonInner} />}
          </View>
          <Text style={styles.roleTitle}>ファン</Text>
          <Text style={styles.roleDescription}>
            プレーヤーを応援・閲覧したい家族/友人/興味層
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.nextButton, !selectedRole && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!selectedRole}
      >
        <Text style={styles.nextButtonText}>次へ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 48,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  roleContainer: {
    gap: 16,
  },
  roleCard: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 20,
    position: 'relative',
  },
  roleCardSelected: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFF5F0',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B00',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  nextButton: {
    backgroundColor: '#FF6B00',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
  nextButtonDisabled: {
    backgroundColor: '#CCC',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
