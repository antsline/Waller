import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

interface PlayerProfile {
  skill_level: number;
  started_at: string;
  team_name: string | null;
  home_gym: string | null;
  main_location: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  is_open_to_collab: boolean;
}

interface UserProfile {
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    role: 'player' | 'fan';
  };
  player_profile: PlayerProfile | null;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

interface UseProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProfile(userId?: string): UseProfileResult {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ユーザーIDが指定されていない場合は、ログインユーザーのIDを使用
  const targetUserId = userId || authUser?.id;

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ユーザー情報を取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, bio, role')
        .eq('id', targetUserId)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('ユーザーが見つかりません');

      // プレーヤープロフィールを取得（プレーヤーの場合のみ）
      let playerProfile: PlayerProfile | null = null;
      if (userData.role === 'player') {
        const { data: profileData, error: profileError } = await supabase
          .from('player_profiles')
          .select('skill_level, started_at, team_name, home_gym, main_location, twitter_url, instagram_url, youtube_url, is_open_to_collab')
          .eq('user_id', targetUserId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116は「データが見つかりません」エラー
          console.error('プレーヤープロフィール取得エラー:', profileError);
        } else if (profileData) {
          playerProfile = profileData;
        }
      }

      // 投稿数を取得
      const { count: postsCount, error: postsError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('status', 'published');

      if (postsError) {
        console.error('投稿数取得エラー:', postsError);
      }

      // TODO: フォロワー数とフォロー中数を取得（Phase 1で実装）
      const followersCount = 0;
      const followingCount = 0;

      setProfile({
        user: {
          id: userData.id,
          username: userData.username,
          display_name: userData.display_name,
          avatar_url: userData.avatar_url,
          bio: userData.bio,
          role: userData.role,
        },
        player_profile: playerProfile,
        posts_count: postsCount || 0,
        followers_count: followersCount,
        following_count: followingCount,
      });
    } catch (err) {
      console.error('プロフィール取得エラー:', err);
      setError(err instanceof Error ? err.message : 'プロフィールの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchProfile();
  }, [targetUserId, fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}
