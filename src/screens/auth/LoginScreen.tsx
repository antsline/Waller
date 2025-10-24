import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';
import { InlineError } from '../../components/InlineError';
import { supabase } from '../../services/supabase';

type Props = AuthStackScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, loading } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    // メールアドレスのバリデーション
    if (!email) {
      setEmailError('メールアドレスを入力してください');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('有効なメールアドレスを入力してください');
      isValid = false;
    }

    // パスワードのバリデーション
    if (!password) {
      setPasswordError('パスワードを入力してください');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('パスワードは6文字以上で入力してください');
      isValid = false;
    }

    return isValid;
  };

  const handleAuth = async () => {
    // バリデーション
    if (!validateForm()) {
      return;
    }

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
          showToast(
            'Supabaseでメール確認が有効になっています。開発環境では無効にしてください。',
            'warning'
          );
          return;
        }

        showToast('登録が完了しました', 'success');

        // ロール選択画面に遷移
        navigation.navigate('RoleSelection');
      } else {
        console.log('🔑 Calling signInWithEmail...');
        const result = await signInWithEmail(email, password);

        if (!result.user) {
          showToast('ログインに失敗しました', 'error');
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
          showToast('ユーザー情報の取得に失敗しました', 'error');
          return;
        }

        console.log('📊 User data after login:', userData);

        showToast('ログインしました', 'success');

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
      showToast(error.message || 'ネットワークエラーが発生しました', 'error');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsOAuthLoading(true);
      await signInWithGoogle();
      showToast('Googleでログインしました', 'success');
    } catch (error: any) {
      console.error('❌ Google Sign-in failed:', error);
      showToast(error.message || 'Googleログインに失敗しました', 'error');
    } finally {
      setIsOAuthLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsOAuthLoading(true);
      await signInWithApple();
      showToast('Appleでログインしました', 'success');
    } catch (error: any) {
      if (error.message === 'キャンセルされました') {
        // ユーザーがキャンセルした場合はToastを表示しない
        return;
      }
      console.error('❌ Apple Sign-in failed:', error);
      showToast(error.message || 'Appleログインに失敗しました', 'error');
    } finally {
      setIsOAuthLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/login-bg-2.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.form}>
        <Text style={styles.label}>メールアドレス</Text>
        <TextInput
          style={[styles.input, emailError && styles.inputError]}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
          }}
          placeholder="email@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <InlineError message={emailError} visible={!!emailError} />

        <Text style={styles.label}>パスワード</Text>
        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
          }}
          placeholder="6文字以上"
          secureTextEntry
        />
        <InlineError message={passwordError} visible={!!passwordError} />

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

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>または</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.oauthButton}
          onPress={handleGoogleSignIn}
          disabled={loading || isOAuthLoading}
        >
          <Ionicons name="logo-google" size={18} color="#333" style={styles.oauthIcon} />
          <Text style={styles.oauthButtonText}>Googleでログイン</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.oauthButton, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={loading || isOAuthLoading}
          >
            <Ionicons name="logo-apple" size={18} color="#fff" style={styles.oauthIcon} />
            <Text style={[styles.oauthButtonText, styles.appleButtonText]}>
              Appleでログイン
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
  },
  form: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 6,
  },
  inputError: {
    borderColor: '#F44336',
  },
  button: {
    backgroundColor: '#FF6B00',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#FF6B00',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#666',
    fontSize: 12,
  },
  oauthButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  oauthIcon: {
    marginRight: 8,
  },
  oauthButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  appleButtonText: {
    color: '#fff',
  },
});
