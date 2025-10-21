import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import Constants from 'expo-constants';
import axios from 'axios';
import { supabase } from '../../services/supabase';

type Props = AuthStackScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signInWithEmail, signUpWithEmail, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const testConnection = async () => {
    try {
      const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
      console.log('🧪 Testing connection to:', supabaseUrl);

      if (!supabaseUrl) {
        Alert.alert('エラー', 'Supabase URLが設定されていません');
        return;
      }

      // axiosを使った接続テスト
      const response = await axios.head(supabaseUrl, {
        timeout: 10000,
      });

      console.log('✅ Connection test response status:', response.status);
      Alert.alert('接続テスト成功', `ステータス: ${response.status}\nSupabaseへの接続が確認できました`);
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      const errorMsg = error.response
        ? `ステータス: ${error.response.status}\n${error.message}`
        : error.message || '接続できませんでした';
      Alert.alert('接続テスト失敗', errorMsg);
    }
  };

  const handleAuth = async () => {
    try {
      console.log('🎯 Current mode:', isSignUp ? 'SIGNUP (新規登録)' : 'SIGNIN (ログイン)');
      console.log('📧 Email:', email);
      console.log('🔑 Password length:', password.length);

      if (isSignUp) {
        console.log('📝 Calling signUpWithEmail...');
        const result = await signUpWithEmail(email, password);

        console.log('📊 SignUp result:', {
          hasSession: !!result.session,
          hasUser: !!result.user,
          sessionDetails: result.session ? {
            access_token: result.session.access_token?.substring(0, 20) + '...',
            expires_at: result.session.expires_at,
          } : null,
        });

        // セッションが作成されているか確認
        if (!result.session || !result.user) {
          Alert.alert(
            'メール確認が必要です',
            'Supabaseでメール確認が有効になっています。開発環境では、Supabase Dashboard → Authentication → Settings → Enable email confirmations をオフにしてください。'
          );
          return;
        }

        Alert.alert('成功', '登録が完了しました。ロール選択に進んでください。');

        // ロール選択画面に遷移
        navigation.navigate('RoleSelection');
      } else {
        console.log('🔑 Calling signInWithEmail...');
        const result = await signInWithEmail(email, password);

        if (!result.user) {
          return;
        }

        // ログイン成功後、プロフィール状態を確認して適切な画面に遷移
        console.log('🔍 Checking user profile after login...');
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, username, display_name')
          .eq('id', result.user.id)
          .single();

        if (error || !userData) {
          console.error('Failed to fetch user data:', error);
          Alert.alert('エラー', 'ユーザー情報の取得に失敗しました');
          return;
        }

        console.log('📊 User data after login:', userData);

        // プロフィール完了状態に応じて遷移
        if (!userData.role) {
          console.log('➡️ No role, navigating to RoleSelection');
          navigation.navigate('RoleSelection');
        } else if (!userData.username || !userData.display_name) {
          console.log('➡️ Role set but profile incomplete, navigating to profile setup');
          if (userData.role === 'player') {
            navigation.navigate('PlayerProfileSetup');
          } else {
            navigation.navigate('FanProfileSetup');
          }
        } else {
          console.log('✅ Profile complete, RootNavigator will handle navigation to Main');
          // プロフィール完了済み → RootNavigatorが自動的にMainに遷移
        }
      }
    } catch (error: any) {
      console.error('❌ Login/Signup failed:', error);
      Alert.alert('エラー', error.message || 'ネットワークエラーが発生しました');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waller</Text>
      <Text style={styles.subtitle}>ウォールトランポリン特化型SNS</Text>

      <View style={styles.form}>
        <Text style={styles.label}>メールアドレス</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>パスワード</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="6文字以上"
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuth}
          disabled={loading || !email || !password}
        >
          <Text style={styles.buttonText}>
            {isSignUp ? 'アカウント作成' : 'ログイン'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchText}>
            {isSignUp ? 'すでにアカウントをお持ちの方' : 'アカウントをお持ちでない方'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testConnection}>
          <Text style={styles.testButtonText}>
            🧪 Supabase接続テスト
          </Text>
        </TouchableOpacity>

        <Text style={styles.devNote}>
          💡 開発用：メール認証を使用しています{'\n'}
          本番環境ではGoogle/Apple認証を実装予定
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF6B00',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#FF6B00',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  testButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  devNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
});
