import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface UserPost {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

interface UseUserPostsResult {
  posts: UserPost[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserPosts(userId: string | undefined): UseUserPostsResult {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('id, video_url, thumbnail_url, created_at')
        .eq('user_id', userId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPosts(data || []);
    } catch (err) {
      console.error('ユーザー投稿取得エラー:', err);
      setError(err instanceof Error ? err.message : '投稿の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [userId]);

  return {
    posts,
    loading,
    error,
    refetch: fetchPosts,
  };
}
