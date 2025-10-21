import { Database } from './database.types';

// フィード用の型定義
export type FeedPost = Database['public']['Tables']['posts']['Row'] & {
  user: Database['public']['Tables']['users']['Row'];
  player_profile: Database['public']['Tables']['player_profiles']['Row'] | null;
  counters: Database['public']['Tables']['post_counters']['Row'];
};

// カテゴリタグのラベルマッピング
export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  challenge: { label: 'チャレンジ中', icon: '🔥' },
  success: { label: '成功！', icon: '🎉' },
  practice: { label: '練習記録', icon: '📝' },
  combo: { label: '連続技', icon: '🔄' },
  new: { label: '新技', icon: '✨' },
  other: { label: 'その他', icon: '' },
};

// スキルレベルのラベル
export const SKILL_LEVEL_LABELS: Record<number, string> = {
  1: 'Lv1・初心者',
  2: 'Lv2・初級',
  3: 'Lv3・中級',
  4: 'Lv4・上級',
  5: 'Lv5・エキスパート',
};
