import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthStackScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';

type Props = AuthStackScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signInWithEmail, signUpWithEmail, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        Alert.alert('成功', '登録が完了しました。ロール選択に進んでください。');
        navigation.navigate('RoleSelection');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error: any) {
      Alert.alert('エラー', error.message);
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
  devNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
});
