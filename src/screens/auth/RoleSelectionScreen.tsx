import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';

type Props = AuthStackScreenProps<'RoleSelection'>;

export function RoleSelectionScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'player' | 'fan' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    if (!selectedRole || !user) return;

    setIsSubmitting(true);

    try {
      console.log('📝 ロール保存開始:', selectedRole);

      // usersテーブルにroleを保存
      const { error } = await supabase
        .from('users')
        .update({ role: selectedRole })
        .eq('id', user.id);

      if (error) {
        console.error('Role update error:', error);
        throw new Error('ロールの保存に失敗しました');
      }

      console.log('✅ ロール保存完了');

      // プロフィール設定画面に遷移
      if (selectedRole === 'player') {
        navigation.navigate('PlayerProfileSetup');
      } else {
        navigation.navigate('FanProfileSetup');
      }
    } catch (error: any) {
      console.error('ロール保存エラー:', error);
      Alert.alert('エラー', error.message || 'ロールの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.subtitle}>ウォールトランポリン特化型SNS</Text>
          <Text style={styles.appName}>WALLER</Text>
          <Text style={styles.title}>どちらで参加しますか？</Text>
        </View>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleCard, selectedRole === 'player' && styles.roleCardSelected]}
            onPress={() => setSelectedRole('player')}
          >
            <View style={styles.radioButton}>
              {selectedRole === 'player' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.roleTitle}>Waller</Text>
            <Text style={styles.roleDescription}>
              ウォールトランポリンプレーヤー
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, selectedRole === 'fan' && styles.roleCardSelected]}
            onPress={() => setSelectedRole('fan')}
          >
            <View style={styles.radioButton}>
              {selectedRole === 'fan' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.roleTitle}>Supporter</Text>
            <Text style={styles.roleDescription}>
              Wallerを応援・観戦する
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.nextButton, (!selectedRole || isSubmitting) && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!selectedRole || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.nextButtonText}>次へ</Text>
        )}
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
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
