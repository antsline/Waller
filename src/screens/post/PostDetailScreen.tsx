import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeStackScreenProps } from '../../types/navigation';
import { FeedPost, SKILL_LEVEL_LABELS } from '../../types/feed.types';
import { supabase } from '../../services/supabase';
import { formatExperience } from '../../utils/experience';
import { useAuth } from '../../hooks/useAuth';

type Props = HomeStackScreenProps<'PostDetail'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function PostDetailScreen({ route, navigation }: Props) {
  const { postId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 投稿データを取得
  useEffect(() => {
    fetchPost();
  }, [postId]);

  // 画面表示時に自動再生
  useEffect(() => {
    if (post && videoRef.current) {
      videoRef.current.playAsync();
    }

    // クリーンアップ: 画面を離れる時に停止
    return () => {
      if (videoRef.current) {
        videoRef.current.stopAsync();
      }
    };
  }, [post]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!posts_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            role,
            player_profile:player_profiles (
              skill_level,
              started_at,
              team_name,
              home_gym
            )
          ),
          counters:post_counters!post_counters_post_id_fkey (
            like_count,
            reaction_fire_count,
            reaction_clap_count,
            reaction_sparkle_count,
            reaction_muscle_count
          )
        `)
        .eq('id', postId)
        .eq('status', 'published')
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('投稿が見つかりません');

      // player_profileをトップレベルに移動してFeedPost型に合わせる
      const transformedData = {
        ...data,
        player_profile: (data.user as any).player_profile || null,
      };

      setPost(transformedData as unknown as FeedPost);
    } catch (err) {
      console.error('投稿取得エラー:', err);
      setError('投稿の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 動画タップで再生/一時停止
  const handleVideoPress = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  // ミュート切り替え
  const handleMuteToggle = async () => {
    if (!videoRef.current) return;
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    await videoRef.current.setIsMutedAsync(newMutedState);
  };

  // 再生状態の更新
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);

    // 動画が終了したらループ再生
    if (status.didJustFinish) {
      videoRef.current?.replayAsync();
    }
  };

  // メニューボタン押下時
  const handleMenuPress = () => {
    const isOwnPost = post && user && post.user.id === user.id;

    Alert.alert('投稿メニュー', '', [
      ...(isOwnPost
        ? [
            {
              text: '編集',
              onPress: () => {
                // TODO: 編集画面に遷移
                console.log('編集');
              },
            },
            {
              text: '削除',
              style: 'destructive',
              onPress: () => {
                // TODO: 削除処理
                console.log('削除');
              },
            },
          ]
        : [
            {
              text: '通報',
              style: 'destructive',
              onPress: () => {
                // TODO: 通報画面に遷移
                console.log('通報');
              },
            },
          ]),
      {
        text: 'キャンセル',
        style: 'cancel',
      },
    ]);
  };

  // プロフィール画面へ遷移
  const handleUserPress = () => {
    if (!post) return;
    // TODO: プロフィール画面への遷移
    console.log('プロフィール画面へ:', post.user.id);
  };

  // ローディング中
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  // エラー時
  if (error || !post) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#9E9E9E" />
        <Text style={styles.errorText}>{error || '投稿が見つかりません'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 経験年数の表示（例: 1年6ヶ月）
  const experienceText = post.player_profile && post.player_profile.started_at
    ? formatExperience(post.player_profile.started_at)
    : '';

  // スキルレベルの表示
  const skillLevelText = post.player_profile
    ? SKILL_LEVEL_LABELS[post.player_profile.skill_level]
    : '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* 動画（フルスクリーン） */}
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={handleVideoPress}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          source={{ uri: post.video_url }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={true}
          isLooping={true}
          isMuted={isMuted}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* 再生アイコン（一時停止時のみ） */}
        {!isPlaying && (
          <View style={styles.playIconContainer}>
            <Ionicons name="play-circle" size={80} color="rgba(255, 255, 255, 0.9)" />
          </View>
        )}
      </TouchableOpacity>

      {/* 上部オーバーレイ: 戻るボタン、メニュー */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.topButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topButton}
          onPress={handleMenuPress}
        >
          <View style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 下部オーバーレイ: ユーザー情報（左）+ ミュートボタン（右） */}
      <View style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 60 }]}>
        {/* ユーザー情報 */}
        <TouchableOpacity
          style={styles.userSection}
          onPress={handleUserPress}
          activeOpacity={0.7}
        >
          {/* アバター */}
          <View style={styles.avatarContainer}>
            {post.user.avatar_url ? (
              <Image source={{ uri: post.user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={20} color="#9E9E9E" />
              </View>
            )}
          </View>

          {/* ユーザー名とバッジ */}
          <View style={styles.userInfo}>
            <Text style={styles.username}>@{post.user.username}</Text>
            {post.player_profile && (
              <Text style={styles.userBadge}>
                {skillLevelText} · {experienceText}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* ミュートボタン */}
        <TouchableOpacity
          style={styles.muteButton}
          onPress={handleMuteToggle}
        >
          <View style={styles.iconButton}>
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={24}
              color="#fff"
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 24,
  },

  // 動画
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    zIndex: 2,
  },

  // 上部オーバーレイ
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  topButton: {
    padding: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 下部オーバーレイ
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    marginRight: 12,
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  userBadge: {
    fontSize: 11,
    color: '#E0E0E0',
  },
  muteButton: {
    padding: 8,
  },

  // エラー
  errorText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
