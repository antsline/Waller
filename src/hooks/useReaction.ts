import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export type ReactionType = 'fire' | 'clap' | 'sparkle' | 'muscle';

interface ReactionData {
  id: string;
  reaction_type: ReactionType;
  created_at: string;
  updated_at: string;
}

interface UseReactionResult {
  currentReaction: ReactionType | null;
  sendReaction: (type: ReactionType) => Promise<void>;
  removeReaction: () => Promise<void>;
  isLoading: boolean;
  cooldownRemaining: number; // 残りクールダウン時間（秒）
  canChange: boolean; // 変更可能かどうか
}

const COOLDOWN_SECONDS = 30;
const FREE_CHANGE_MINUTES = 10;

export function useReaction(postId: string): UseReactionResult {
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(null);
  const [reactionData, setReactionData] = useState<ReactionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

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

  // リアクション状態を取得
  useEffect(() => {
    if (!userId) return;

    const fetchReaction = async () => {
      try {
        const { data, error } = await supabase
          .from('reactions')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching reaction:', error);
          return;
        }

        if (data) {
          setCurrentReaction(data.reaction_type as ReactionType);
          setReactionData(data as ReactionData);
        } else {
          setCurrentReaction(null);
          setReactionData(null);
        }
      } catch (error) {
        console.error('Error in fetchReaction:', error);
      }
    };

    fetchReaction();
  }, [postId, userId]);

  // クールダウンタイマー
  useEffect(() => {
    if (!reactionData) {
      setCooldownRemaining(0);
      return;
    }

    const checkCooldown = () => {
      const updatedAt = new Date(reactionData.updated_at);
      const createdAt = new Date(reactionData.created_at);
      const now = new Date();

      // 作成から10分以内は自由に変更可能
      const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / 1000 / 60;
      if (minutesSinceCreation < FREE_CHANGE_MINUTES) {
        setCooldownRemaining(0);
        return;
      }

      // 10分経過後は、最後の更新から30秒のクールダウン
      const secondsSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000;
      const remaining = Math.max(0, COOLDOWN_SECONDS - secondsSinceUpdate);
      setCooldownRemaining(Math.ceil(remaining));
    };

    checkCooldown();

    // 1秒ごとに更新
    const interval = setInterval(checkCooldown, 1000);

    return () => clearInterval(interval);
  }, [reactionData]);

  const canChange = cooldownRemaining === 0;

  const sendReaction = async (type: ReactionType) => {
    if (!userId || isLoading) return;

    // クールダウン中は変更不可
    if (!canChange) {
      console.log(`⏳ Cooldown remaining: ${cooldownRemaining}s`);
      return;
    }

    setIsLoading(true);

    // 楽観的更新
    const previousReaction = currentReaction;
    const previousData = reactionData;
    setCurrentReaction(type);

    try {
      if (currentReaction) {
        // 既存のリアクションを更新（種類変更）
        const { error } = await supabase
          .from('reactions')
          .update({
            reaction_type: type,
            previous_type: currentReaction,
          })
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating reaction:', error);
          throw error;
        }

        console.log(`✅ Reaction updated: ${currentReaction} → ${type}`);

        // 更新後のデータを取得
        const { data: updatedData } = await supabase
          .from('reactions')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .single();

        if (updatedData) {
          setReactionData(updatedData as ReactionData);
        }
      } else {
        // 新規リアクション追加
        const { data, error } = await supabase
          .from('reactions')
          .insert({
            post_id: postId,
            user_id: userId,
            reaction_type: type,
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding reaction:', error);
          throw error;
        }

        console.log(`✅ Reaction added: ${type}`);

        if (data) {
          setReactionData(data as ReactionData);
        }
      }
    } catch (error) {
      // エラー時はロールバック
      console.error('Reaction send failed, rolling back:', error);
      setCurrentReaction(previousReaction);
      setReactionData(previousData);
    } finally {
      setIsLoading(false);
    }
  };

  const removeReaction = async () => {
    if (!userId || isLoading || !currentReaction) return;

    // クールダウン中は削除不可
    if (!canChange) {
      console.log(`⏳ Cooldown remaining: ${cooldownRemaining}s`);
      return;
    }

    setIsLoading(true);

    // 楽観的更新
    const previousReaction = currentReaction;
    const previousData = reactionData;
    setCurrentReaction(null);
    setReactionData(null);

    try {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing reaction:', error);
        throw error;
      }

      console.log('✅ Reaction removed');
    } catch (error) {
      // エラー時はロールバック
      console.error('Reaction remove failed, rolling back:', error);
      setCurrentReaction(previousReaction);
      setReactionData(previousData);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentReaction,
    sendReaction,
    removeReaction,
    isLoading,
    cooldownRemaining,
    canChange,
  };
}
