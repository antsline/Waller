import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

interface DeleteCheckResult {
  canDelete: boolean;
  isWithin10Minutes: boolean;
  remainingDeletes: number;
  errorMessage?: string;
}

interface UseDeletePostResult {
  checkDeletePermission: (createdAt: string) => Promise<DeleteCheckResult>;
  executeDelete: (postId: string) => Promise<{ success: boolean; error?: string }>;
  isDeleting: boolean;
}

export function useDeletePost(): UseDeletePostResult {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  // 削除可能かチェック
  const checkDeletePermission = async (createdAt: string): Promise<DeleteCheckResult> => {
    if (!user) {
      return {
        canDelete: false,
        isWithin10Minutes: false,
        remainingDeletes: 0,
        errorMessage: 'ログインしてください',
      };
    }

    try {
      // 1. 投稿が10分以内かチェック
      const postCreatedAt = new Date(createdAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - postCreatedAt.getTime()) / (1000 * 60);
      const isWithin10Minutes = diffMinutes <= 10;

      // 10分以内なら無制限
      if (isWithin10Minutes) {
        return {
          canDelete: true,
          isWithin10Minutes: true,
          remainingDeletes: 999,
        };
      }

      // 2. 10分経過後は1日3回制限チェック
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error: countError } = await supabase
        .from('deletion_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('deleted_at', today.toISOString());

      if (countError) {
        console.error('削除回数確認エラー:', countError);
        return {
          canDelete: false,
          isWithin10Minutes: false,
          remainingDeletes: 0,
          errorMessage: '削除回数の確認に失敗しました',
        };
      }

      const usedDeletes = count || 0;
      const remainingDeletes = Math.max(0, 3 - usedDeletes);

      if (usedDeletes >= 3) {
        return {
          canDelete: false,
          isWithin10Minutes: false,
          remainingDeletes: 0,
          errorMessage: '本日の削除上限（3回）に達しました。\n投稿から10分以内であれば無制限に削除できます。',
        };
      }

      return {
        canDelete: true,
        isWithin10Minutes: false,
        remainingDeletes,
      };
    } catch (error) {
      console.error('削除チェックエラー:', error);
      return {
        canDelete: false,
        isWithin10Minutes: false,
        remainingDeletes: 0,
        errorMessage: '予期しないエラーが発生しました',
      };
    }
  };

  // 削除を実行
  const executeDelete = async (postId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'ログインしてください' };
    }

    try {
      setIsDeleting(true);

      // 投稿を削除
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id); // 自分の投稿のみ削除可能

      if (deleteError) {
        console.error('投稿削除エラー:', deleteError);
        return { success: false, error: '投稿の削除に失敗しました' };
      }

      // 削除ログを記録
      const { error: logError } = await supabase
        .from('deletion_logs')
        .insert({
          user_id: user.id,
          post_id: postId,
        });

      if (logError) {
        console.error('削除ログ記録エラー:', logError);
        // ログ記録失敗はユーザーには通知しない（削除自体は成功しているため）
      }

      return { success: true };
    } catch (error) {
      console.error('削除処理エラー:', error);
      return { success: false, error: '予期しないエラーが発生しました' };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    checkDeletePermission,
    executeDelete,
    isDeleting,
  };
}
