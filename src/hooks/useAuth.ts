import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '../services/supabase';
import Constants from 'expo-constants';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  userRole: 'player' | 'fan' | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
    isProfileComplete: false,
    userRole: null,
  });

  // プロフィール設定完了状態をチェック
  const checkProfileComplete = async (
    userId: string
  ): Promise<{ isComplete: boolean; role: 'player' | 'fan' | null }> => {
    try {
      console.log('🔍 Checking profile completion for user:', userId);

      const { data, error } = await supabase
        .from('users')
        .select('role, username, display_name')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.warn('❌ Failed to fetch user profile:', error);
        return { isComplete: false, role: null };
      }

      console.log('📊 Profile data:', {
        role: data.role,
        username: data.username,
        display_name: data.display_name,
      });

      // role, username, display_name が全て設定されていればプロフィール完了
      const isComplete = !!(data.role && data.username && data.display_name);
      const result = { isComplete, role: data.role as 'player' | 'fan' | null };

      console.log('✅ Profile check result:', result);
      return result;
    } catch (error) {
      console.warn('❌ Error checking profile completion:', error);
      return { isComplete: false, role: null };
    }
  };

  useEffect(() => {
    // Google Sign-in初期化
    const googleClientId = Constants.expoConfig?.extra?.googleClientId;
    if (googleClientId) {
      GoogleSignin.configure({
        webClientId: googleClientId,
      });
    }

    // 初回セッション取得
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const profileStatus = session?.user
        ? await checkProfileComplete(session.user.id)
        : { isComplete: false, role: null };

      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        isAuthenticated: !!session,
        isProfileComplete: profileStatus.isComplete,
        userRole: profileStatus.role,
      });

      // last_login_at更新
      if (session?.user) {
        updateLastLogin(session.user.id);
      }
    });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, 'hasSession:', !!session);

      const profileStatus = session?.user
        ? await checkProfileComplete(session.user.id)
        : { isComplete: false, role: null };

      const newAuthState = {
        user: session?.user ?? null,
        session,
        loading: false,
        isAuthenticated: !!session,
        isProfileComplete: profileStatus.isComplete,
        userRole: profileStatus.role,
      };

      console.log('📱 Setting auth state:', {
        isAuthenticated: newAuthState.isAuthenticated,
        isProfileComplete: newAuthState.isProfileComplete,
        userRole: newAuthState.userRole,
      });

      setAuthState(newAuthState);

      // ログイン時にlast_login_at更新
      if (session?.user) {
        updateLastLogin(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // last_login_at更新関数
  const updateLastLogin = async (userId: string) => {
    try {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.warn('Failed to update last_login_at:', error);
    }
  };

  // Google認証
  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Starting Google Sign-in...');

      // Google Sign-inフロー
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      console.log('✅ Google Sign-in successful:', userInfo.data?.user.email);

      if (!userInfo.data?.idToken) {
        throw new Error('Google ID token not found');
      }

      // SupabaseでGoogle認証
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: userInfo.data.idToken,
      });

      if (error) {
        console.error('❌ Supabase Google auth error:', error);
        throw error;
      }

      console.log('✅ Supabase Google auth successful');
      return data;
    } catch (error) {
      console.error('❌ Google Sign-in error:', error);
      throw error;
    }
  };

  // Apple認証
  const signInWithApple = async () => {
    try {
      console.log('🍎 Starting Apple Sign-in...');

      // nonce生成
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      // Apple認証
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      console.log('✅ Apple Sign-in successful');

      if (!credential.identityToken) {
        throw new Error('Apple identity token not found');
      }

      // SupabaseでApple認証
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce,
      });

      if (error) {
        console.error('❌ Supabase Apple auth error:', error);
        throw error;
      }

      console.log('✅ Supabase Apple auth successful');
      return data;
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('ℹ️ User canceled Apple Sign-in');
        throw new Error('キャンセルされました');
      }
      console.error('❌ Apple Sign-in error:', error);
      throw error;
    }
  };

  // 開発用：メール認証
  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('🔑 Attempting signin with email:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Signin error from Supabase:', error);
        throw error;
      }

      console.log('✅ Signin successful');
      return data;
    } catch (error) {
      console.error('❌ Signin exception:', error);
      throw error;
    }
  };

  // 開発用：メールサインアップ
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      console.log('📝 Attempting signup with email:', email);
      console.log('🔐 Password length:', password.length);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('❌ Signup error from Supabase:', error);
        throw error;
      }

      console.log('✅ Signup successful:', data);
      return data;
    } catch (error) {
      console.error('❌ Signup exception:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      throw error;
    }
  };

  // ログアウト
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  // プロフィール状態を手動で再チェック（プロフィール登録完了後に使用）
  const refetchProfile = async () => {
    console.log('🔄 Manual profile refetch triggered');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log('❌ No session found for refetch');
      return;
    }

    const profileStatus = await checkProfileComplete(session.user.id);

    const newState = {
      user: session.user,
      session,
      loading: false,
      isAuthenticated: true,
      isProfileComplete: profileStatus.isComplete,
      userRole: profileStatus.role,
    };

    console.log('🔄 Setting new auth state:', newState);
    setAuthState(newState);

    console.log('✅ Profile refetch complete:', profileStatus);
  };

  return {
    ...authState,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refetchProfile,
  };
}
