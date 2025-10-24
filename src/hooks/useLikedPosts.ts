import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface LikedPost {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

interface UseLikedPostsResult {
  posts: LikedPost[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLikedPosts(userId: string | undefined): UseLikedPostsResult {
  const [posts, setPosts] = useState<LikedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLikedPosts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // likesテーブルからいいねした投稿のIDを取得し、postsテーブルと結合
      const { data, error: fetchError } = await supabase
        .from('likes')
        .select(`
          post_id,
          created_at,
          post:posts!likes_post_id_fkey (
            id,
            video_url,
            thumbnail_url,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // データを整形
      const likedPosts = (data || [])
        .filter((item) => item.post) // 削除された投稿を除外
        .map((item) => ({
          id: item.post.id,
          video_url: item.post.video_url,
          thumbnail_url: item.post.thumbnail_url,
          created_at: item.post.created_at,
        }));

      setPosts(likedPosts);
    } catch (err) {
      console.error('いいね投稿取得エラー:', err);
      setError(err instanceof Error ? err.message : 'いいね投稿の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedPosts();
  }, [userId]);

  return {
    posts,
    loading,
    error,
    refetch: fetchLikedPosts,
  };
}
