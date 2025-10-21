import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // 初回セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        isAuthenticated: !!session,
      });

      // last_login_at更新
      if (session?.user) {
        updateLastLogin(session.user.id);
      }
    });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        isAuthenticated: !!session,
      });

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

  // Google認証（開発用：メール認証で代用）
  const signInWithGoogle = async () => {
    try {
      // TODO: 本番環境ではOAuth設定後に以下のコードを使用
      // const { data, error } = await supabase.auth.signInWithOAuth({
      //   provider: 'google',
      //   options: {
        //     redirectTo: 'waller://auth/callback',
      //   },
      // });

      // 開発用：メール認証で代用
      throw new Error('Google認証は本番環境で設定してください。開発中はsignInWithEmailを使用してください。');
    } catch (error) {
      throw error;
    }
  };

  // Apple認証（開発用：メール認証で代用）
  const signInWithApple = async () => {
    try {
      // TODO: 本番環境ではOAuth設定後に以下のコードを使用
      // const { data, error } = await supabase.auth.signInWithOAuth({
      //   provider: 'apple',
      //   options: {
      //     redirectTo: 'waller://auth/callback',
      //   },
      // });

      // 開発用：メール認証で代用
      throw new Error('Apple認証は本番環境で設定してください。開発中はsignInWithEmailを使用してください。');
    } catch (error) {
      throw error;
    }
  };

  // 開発用：メール認証
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  };

  // 開発用：メールサインアップ
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
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

  return {
    ...authState,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
