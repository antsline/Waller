# 🛠️ Waller 実装ガイド

---

## 📌 このドキュメントの目的

AI駆動開発において、一貫性のあるコードを生成するための実装パターン集です。
Claude/Copilot に実装を依頼する際は、このガイドを参照するよう指示してください。

---

## 1. プロジェクト初期設定

### 1-1. Expoプロジェクト作成

```bash
# プロジェクト作成
npx create-expo-app waller --template blank-typescript

cd waller

# 必須パッケージのインストール
npm install @supabase/supabase-js
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npm install zustand @tanstack/react-query
npx expo install expo-av expo-image-picker expo-video-thumbnails
npx expo install @react-native-async-storage/async-storage
npm install date-fns
```

### 1-2. app.json 設定

```json
{
  "expo": {
    "name": "Waller",
    "slug": "waller",
    "version": "1.0.0",
    "scheme": "waller",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FF6B00"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.yourcompany.waller"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.waller"
    },
    "plugins": [
      "expo-image-picker",
      "expo-av"
    ]
  }
}
```

---

## 2. TypeScript設定

### 2-1. tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2-2. 型定義の作成

`src/types/database.types.ts`:
```typescript
// Supabaseから自動生成される型定義
// supabase gen types typescript --project-id xxxxx > src/types/database.types.ts

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          role: 'player' | 'fan';
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          username_change_count: number;
          status: 'active' | 'suspended' | 'deleted';
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      // 他のテーブルも同様に定義...
    };
  };
};
```

`src/types/models.ts`:
```typescript
export interface User {
  id: string;
  role: 'player' | 'fan';
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface PlayerProfile {
  user_id: string;
  experience_years: number;
  experience_months: number;
  skill_level: 1 | 2 | 3 | 4 | 5;
  team_name?: string;
  home_gym?: string;
}

export interface Post {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string;
  video_duration: number;
  video_size: number;
  caption?: string;
  category_tag?: CategoryTag;
  status: 'published' | 'deleted' | 'reported';
  created_at: string;
  updated_at: string;
}

export type CategoryTag = 'challenge' | 'success' | 'practice' | 'combo' | 'new' | 'other';

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export type ReactionType = 'fire' | 'clap' | 'sparkle' | 'muscle';

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  previous_type?: ReactionType;
  created_at: string;
  updated_at: string;
}

export interface PostCounters {
  post_id: string;
  like_count: number;
  reaction_fire_count: number;
  reaction_clap_count: number;
  reaction_sparkle_count: number;
  reaction_muscle_count: number;
}

export interface PostWithDetails extends Post {
  user: User;
  player_profile?: PlayerProfile;
  counters: PostCounters;
  is_liked?: boolean;
  current_reaction?: ReactionType;
}
```

---

## 3. 認証関連の実装パターン

### 3-1. Supabaseクライアント初期化

`src/services/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### 3-2. 認証フック

`src/hooks/useAuth.ts`:
```typescript
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 現在のセッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // セッション変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // last_login_at更新
        if (session?.user) {
          supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', session.user.id)
            .then();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'waller://auth/callback',
      },
    });
    if (error) throw error;
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'waller://auth/callback',
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    session,
    user,
    loading,
    signInWithGoogle,
    signInWithApple,
    signOut,
  };
}
```

### 3-3. プロフィール作成

`src/services/profile.ts`:
```typescript
import { supabase } from './supabase';

interface CreatePlayerProfileParams {
  userId: string;
  username: string;
  displayName: string;
  experienceYears: number;
  experienceMonths: number;
  skillLevel: 1 | 2 | 3 | 4 | 5;
  teamName?: string;
  homeGym?: string;
  avatarUrl?: string;
  bio?: string;
}

export async function createPlayerProfile(params: CreatePlayerProfileParams) {
  // 1. usersテーブルに挿入
  const { error: userError } = await supabase.from('users').insert({
    id: params.userId,
    role: 'player',
    username: params.username,
    display_name: params.displayName,
    avatar_url: params.avatarUrl,
    bio: params.bio,
  });

  if (userError) throw userError;

  // 2. player_profilesテーブルに挿入
  const { error: profileError } = await supabase.from('player_profiles').insert({
    user_id: params.userId,
    experience_years: params.experienceYears,
    experience_months: params.experienceMonths,
    skill_level: params.skillLevel,
    team_name: params.teamName,
    home_gym: params.homeGym,
  });

  if (profileError) throw profileError;
}

interface CreateFanProfileParams {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
}

export async function createFanProfile(params: CreateFanProfileParams) {
  const { error } = await supabase.from('users').insert({
    id: params.userId,
    role: 'fan',
    username: params.username,
    display_name: params.displayName,
    avatar_url: params.avatarUrl,
    bio: params.bio,
  });

  if (error) throw error;
}
```

---

## 4. データ取得パターン（React Query）

### 4-1. React Query設定

`src/providers/QueryProvider.tsx`:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5分
      cacheTime: 10 * 60 * 1000, // 10分
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 4-2. フィード取得フック

`src/hooks/useFeed.ts`:
```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { PostWithDetails } from '../types/models';

const POSTS_PER_PAGE = 10;

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!inner(id, username, display_name, avatar_url, role),
          player_profile:player_profiles(skill_level, experience_years, experience_months, team_name, home_gym),
          counters:post_counters(*)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + POSTS_PER_PAGE - 1);

      if (error) throw error;
      return data as PostWithDetails[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < POSTS_PER_PAGE) return undefined;
      return allPages.length * POSTS_PER_PAGE;
    },
  });
}
```

### 4-3. プロフィール取得フック

`src/hooks/useProfile.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { User, PlayerProfile } from '../types/models';

export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (user.role === 'player') {
        const { data: profile, error: profileError } = await supabase
          .from('player_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) throw profileError;

        return { user, profile };
      }

      return { user, profile: null };
    },
  });
}
```

---

## 5. リアクション実装パターン

### 5-1. いいねフック

`src/hooks/useLike.ts`:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export function useLike(postId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async (isLiked: boolean) => {
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        // いいね削除
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: user.id });
        
        if (error) throw error;
      } else {
        // いいね追加
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
        
        if (error) throw error;
      }
    },
    onMutate: async (isLiked) => {
      // 楽観的更新
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousData = queryClient.getQueryData(['feed']);

      queryClient.setQueryData(['feed'], (old: any) => {
        // カウンターを即座に更新
        return old;
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // エラー時はロールバック
      if (context?.previousData) {
        queryClient.setQueryData(['feed'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return likeMutation;
}
```

### 5-2. スタンプフック

`src/hooks/useReaction.ts`:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import { ReactionType } from '../types/models';

export function useReaction(postId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reactionMutation = useMutation({
    mutationFn: async ({
      type,
      currentReaction,
      reactionCreatedAt,
    }: {
      type: ReactionType;
      currentReaction?: ReactionType;
      reactionCreatedAt?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // 10分ルール・クールダウンチェック
      if (currentReaction && reactionCreatedAt) {
        const createdAt = new Date(reactionCreatedAt);
        const now = new Date();
        const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;

        if (diffMinutes > 10) {
          // 10分経過後は30秒クールダウン
          // TODO: 最終変更時刻をチェックして30秒以内ならエラー
        }
      }

      if (currentReaction) {
        // 変更
        const { error } = await supabase
          .from('reactions')
          .update({
            reaction_type: type,
            previous_type: currentReaction,
          })
          .match({ post_id: postId, user_id: user.id });

        if (error) throw error;
      } else {
        // 新規追加
        const { error } = await supabase
          .from('reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: type,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return reactionMutation;
}
```

---

## 6. 投稿実装パターン

### 6-1. 動画選択フック

`src/hooks/useVideoPicker.ts`:
```typescript
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export function useVideoPicker() {
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickVideo = async () => {
    try {
      setError(null);

      // 権限確認
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('カメラロールへのアクセス許可が必要です');
        return;
      }

      // 動画選択
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoMaxDuration: 60,
        quality: 0.8,
        videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
      });

      if (result.canceled) return;

      const selectedVideo = result.assets[0];

      // 動画情報取得
      const fileInfo = await FileSystem.getInfoAsync(selectedVideo.uri);
      if (!fileInfo.exists) {
        setError('動画ファイルが見つかりません');
        return;
      }

      // バリデーション
      const fileSize = fileInfo.size || 0;
      const duration = selectedVideo.duration || 0;

      if (duration < 3) {
        setError('動画の長さは3〜60秒にしてください');
        return;
      }

      if (duration > 60) {
        setError('動画の長さは3〜60秒にしてください');
        return;
      }

      if (fileSize > 100 * 1024 * 1024) {
        setError('動画サイズが大きすぎます（100MB以下にしてください）');
        return;
      }

      setVideo(selectedVideo);
    } catch (err) {
      setError('動画の選択に失敗しました');
      console.error(err);
    }
  };

  return { pickVideo, video, error, clearVideo: () => setVideo(null) };
}
```

### 6-2. サムネイル生成

`src/utils/generateThumbnail.ts`:
```typescript
import * as VideoThumbnails from 'expo-video-thumbnails';

export async function generateThumbnail(videoUri: string): Promise<string> {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 1000, // 1秒目
    });
    return uri;
  } catch (error) {
    console.error('サムネイル生成エラー:', error);
    throw new Error('サムネイルの生成に失敗しました');
  }
}
```

### 6-3. 動画アップロード

`src/services/storage.ts`:
```typescript
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

export async function uploadVideo(
  userId: string,
  postId: string,
  videoUri: string,
  thumbnailUri: string,
  onProgress?: (progress: number) => void
): Promise<{ videoUrl: string; thumbnailUrl: string }> {
  try {
    // 動画をBase64に変換
    const videoBase64 = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // サムネイルをBase64に変換
    const thumbnailBase64 = await FileSystem.readAsStringAsync(thumbnailUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 動画アップロード
    const videoPath = `${userId}/${postId}.mp4`;
    const { error: videoError } = await supabase.storage
      .from('videos')
      .upload(videoPath, decode(videoBase64), {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (videoError) throw videoError;

    // サムネイルアップロード
    const thumbPath = `${userId}/${postId}_thumb.jpg`;
    const { error: thumbError } = await supabase.storage
      .from('videos')
      .upload(thumbPath, decode(thumbnailBase64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (thumbError) throw thumbError;

    // 公開URL取得
    const { data: videoUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(videoPath);

    const { data: thumbUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(thumbPath);

    return {
      videoUrl: videoUrlData.publicUrl,
      thumbnailUrl: thumbUrlData.publicUrl,
    };
  } catch (error) {
    console.error('アップロードエラー:', error);
    throw new Error('動画のアップロードに失敗しました');
  }
}
```

### 6-4. 投稿作成

`src/hooks/useCreatePost.ts`:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { uploadVideo } from '../services/storage';
import { generateThumbnail } from '../utils/generateThumbnail';
import { useAuth } from './useAuth';
import { CategoryTag } from '../types/models';

interface CreatePostParams {
  videoUri: string;
  videoDuration: number;
  videoSize: number;
  caption?: string;
  categoryTag?: CategoryTag;
}

export function useCreatePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreatePostParams) => {
      if (!user) throw new Error('Not authenticated');

      // 1. サムネイル生成
      const thumbnailUri = await generateThumbnail(params.videoUri);

      // 2. 投稿ID生成
      const postId = crypto.randomUUID();

      // 3. 動画アップロード
      const { videoUrl, thumbnailUrl } = await uploadVideo(
        user.id,
        postId,
        params.videoUri,
        thumbnailUri
      );

      // 4. postsテーブルに挿入
      const { error } = await supabase.from('posts').insert({
        id: postId,
        user_id: user.id,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        video_duration: params.videoDuration,
        video_size: params.videoSize,
        caption: params.caption,
        category_tag: params.categoryTag,
      });

      if (error) throw error;

      return postId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
```

---

## 7. コンポーネント実装パターン

### 7-1. ボタンコンポーネント

`src/components/Button.tsx`:
```typescript
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  children: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#FF6B00',
  },
  secondary: {
    backgroundColor: '#9E9E9E',
  },
  outline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  danger: {
    backgroundColor: '#F44336',
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#FF6B00',
  },
  dangerText: {
    color: '#FFFFFF',
  },
});
```

### 7-2. PostCardコンポーネント

`src/components/PostCard.tsx`:
```typescript
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react/native';
import { PostWithDetails } from '../types/models';

interface PostCardProps {
  post: PostWithDetails;
  onPress: () => void;
  onLike: () => void;
  onReaction: (type: ReactionType) => void;
}

export function PostCard({ post, onPress, onLike, onReaction }: PostCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      {/* ユーザー情報 */}
      <View style={styles.header}>
        <Image source={{ uri: post.user.avatar_url }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{post.user.display_name}</Text>
          <Text style={styles.username}>@{post.user.username}</Text>
        </View>
      </View>

      {/* 動画サムネイル */}
      <Image source={{ uri: post.thumbnail_url }} style={styles.thumbnail} />

      {/* カテゴリタグ */}
      {post.category_tag && (
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{getCategoryLabel(post.category_tag)}</Text>
        </View>
      )}

      {/* キャプション */}
      {post.caption && (
        <Text style={styles.caption} numberOfLines={2}>
          {post.caption}
        </Text>
      )}

      {/* リアクション */}
      <View style={styles.reactions}>
        <Text>❤️ {post.counters.like_count}</Text>
        <Text>🔥 {post.counters.reaction_fire_count}</Text>
        <Text>👏 {post.counters.reaction_clap_count}</Text>
        <Text>✨ {post.counters.reaction_sparkle_count}</Text>
        <Text>💪 {post.counters.reaction_muscle_count}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  username: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 12,
  },
  reactions: {
    flexDirection: 'row',
    gap: 12,
  },
});

function getCategoryLabel(tag: CategoryTag): string {
  const labels = {
    challenge: '🔥 チャレンジ中',
    success: '🎉 成功',
    practice: '📝 練習記録',
    combo: '🔄 連続技',
    new: '✨ 新技',
    other: 'その他',
  };
  return labels[tag];
}
```

---

## 8. エラーハンドリングパターン

### 8-1. エラー境界コンポーネント

`src/components/ErrorBoundary.tsx`:
```typescript
import React, { Component, ReactNode } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>エラーが発生しました</Text>
          <Text style={styles.message}>
            アプリを再起動してください
          </Text>
          <Button
            title="リロード"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 24,
  },
});
```

### 8-2. トーストコンポーネント

`src/components/Toast.tsx`:
```typescript
import { useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

export function Toast({ message, type = 'info', onDismiss }: ToastProps) {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2700),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  }, []);

  return (
    <Animated.View style={[styles.toast, styles[type], { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
  },
  success: {
    backgroundColor: '#4CAF50',
  },
  error: {
    backgroundColor: '#F44336',
  },
  info: {
    backgroundColor: '#2196F3',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
});
```

---

## 9. コーディング規約

### 9-1. 命名規則

- **コンポーネント**: PascalCase（例: `PostCard`, `Button`）
- **フック**: camelCase + `use` prefix（例: `useAuth`, `useFeed`）
- **関数**: camelCase（例: `generateThumbnail`, `uploadVideo`）
- **定数**: UPPER_SNAKE_CASE（例: `POSTS_PER_PAGE`, `MAX_FILE_SIZE`）
- **型**: PascalCase（例: `Post`, `User`）

### 9-2. ファイル構成

- **1ファイル1コンポーネント**
- **1ファイル1フック**
- **関連する型は同じファイルに配置可**

### 9-3. Import順序

```typescript
// 1. React関連
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

// 2. 外部ライブラリ
import { useQuery } from '@tanstack/react-query';

// 3. 内部モジュール（絶対パス）
import { supabase } from '@/services/supabase';
import { PostCard } from '@/components/PostCard';

// 4. 型定義
import type { Post, User } from '@/types/models';
```

### 9-4. コメント規約

```typescript
// ❌ 悪い例: 自明なコメント
// ユーザーIDを取得
const userId = user.id;

// ✅ 良い例: 複雑なロジックの説明
// 10分以内は自由変更、それ以降は30秒クールダウン
if (diffMinutes <= 10) {
  // 変更可能
} else {
  // クールダウンチェック
}
```

---

## 10. テストパターン

### 10-1. ユニットテスト例

`src/utils/__tests__/validation.test.ts`:
```typescript
import { validateUsername, validateCaption } from '../validation';

describe('validateUsername', () => {
  it('3-15文字の英数字+_を許可', () => {
    expect(validateUsername('abc')).toBe(true);
    expect(validateUsername('abc_123')).toBe(true);
    expect(validateUsername('user_name_123')).toBe(true);
  });

  it('2文字以下を拒否', () => {
    expect(validateUsername('ab')).toBe(false);
  });

  it('16文字以上を拒否', () => {
    expect(validateUsername('a'.repeat(16))).toBe(false);
  });

  it('記号を拒否', () => {
    expect(validateUsername('abc@123')).toBe(false);
    expect(validateUsername('abc-123')).toBe(false);
  });
});
```

---

## 11. パフォーマンス最適化

### 11-1. 画像最適化

```typescript
// expo-image を使用（React Native Image より高速）
import { Image } from 'expo-image';

<Image
  source={{ uri: post.thumbnail_url }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
  style={styles.thumbnail}
/>
```

### 11-2. FlatList最適化

```typescript
<FlatList
  data={posts}
  renderItem={({ item }) => <PostCard post={item} />}
  keyExtractor={(item) => item.id}
  // パフォーマンス最適化
  windowSize={5}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
  initialNumToRender={10}
  // メモ化
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

---

**このガイドを参照して一貫性のあるコードを生成してください。**