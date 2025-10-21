import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface UseLikeResult {
  isLiked: boolean;
  toggleLike: () => Promise<void>;
  isLoading: boolean;
}

export function useLike(postId: string): UseLikeResult {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 現在のユーザーIDを取得
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  // いいね状態を取得
  useEffect(() => {
    if (!userId) return;

    const fetchLikeStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          // PGRST116は「レコードが見つからない」エラーで正常
          console.error('Error fetching like status:', error);
          return;
        }

        setIsLiked(!!data);
      } catch (error) {
        console.error('Error in fetchLikeStatus:', error);
      }
    };

    fetchLikeStatus();
  }, [postId, userId]);

  const toggleLike = async () => {
    if (!userId || isLoading) return;

    setIsLoading(true);

    // 楽観的更新: UIを先に更新
    const previousState = isLiked;
    setIsLiked(!isLiked);

    try {
      if (previousState) {
        // いいね削除
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (error) {
          console.error('Error removing like:', error);
          throw error;
        }

        console.log('✅ Like removed');
      } else {
        // いいね追加
        const { error } = await supabase.from('likes').insert({
          post_id: postId,
          user_id: userId,
        });

        if (error) {
          console.error('Error adding like:', error);
          throw error;
        }

        console.log('✅ Like added');
      }
    } catch (error) {
      // エラー時はロールバック
      console.error('Like toggle failed, rolling back:', error);
      setIsLiked(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLiked,
    toggleLike,
    isLoading,
  };
}
