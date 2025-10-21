import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedPost, CATEGORY_LABELS, SKILL_LEVEL_LABELS } from '../types/feed.types';
import { VideoPlayer } from './VideoPlayer';

interface PostCardProps {
  post: FeedPost;
  onPress?: () => void;
  onUserPress?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function PostCard({ post, onPress, onUserPress }: PostCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);

  const categoryInfo = post.category_tag ? CATEGORY_LABELS[post.category_tag] : null;

  // 経験年数の表示（例: 1年6ヶ月）
  const experienceText = post.player_profile
    ? `${post.player_profile.experience_years}年${
        post.player_profile.experience_months > 0
          ? `${post.player_profile.experience_months}ヶ月`
          : ''
      }`
    : '';

  // スキルレベルの表示
  const skillLevelText = post.player_profile
    ? SKILL_LEVEL_LABELS[post.player_profile.skill_level]
    : '';

  // キャプションの表示（2行まで）
  const shouldTruncateCaption = post.caption && post.caption.length > 60;
  const displayCaption =
    post.caption && !showFullCaption && shouldTruncateCaption
      ? post.caption.substring(0, 60) + '...'
      : post.caption;

  return (
    <View style={styles.container}>
      {/* ユーザー情報バー */}
      <TouchableOpacity
        style={styles.userBar}
        onPress={onUserPress}
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

        {/* ユーザー情報 */}
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.username}>@{post.user.username}</Text>
            {post.player_profile && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {skillLevelText} · {experienceText}
                </Text>
              </View>
            )}
          </View>
          {post.player_profile && (post.player_profile.team_name || post.player_profile.home_gym) && (
            <Text style={styles.teamGym}>
              {[post.player_profile.team_name, post.player_profile.home_gym]
                .filter(Boolean)
                .join(' / ')}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* 動画エリア */}
      <View style={styles.videoContainer}>
        <VideoPlayer
          videoUrl={post.video_url}
          thumbnailUrl={post.thumbnail_url}
          videoWidth={1080}  // TODO: 実際のサイズを保存する
          videoHeight={1920} // TODO: 実際のサイズを保存する
          style={styles.video}
        />

        {/* カテゴリタグオーバーレイ */}
        {categoryInfo && (
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>
              {categoryInfo.icon} {categoryInfo.label}
            </Text>
          </View>
        )}
      </View>

      {/* キャプション */}
      {post.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>{displayCaption}</Text>
          {shouldTruncateCaption && !showFullCaption && (
            <TouchableOpacity onPress={() => setShowFullCaption(true)}>
              <Text style={styles.moreButton}>もっと見る</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* リアクションバー */}
      <View style={styles.reactionBar}>
        <View style={styles.reactionCounts}>
          {/* いいね */}
          <View style={styles.reactionItem}>
            <Ionicons name="heart" size={18} color="#F44336" />
            <Text style={styles.reactionCount}>{post.counters.like_count}</Text>
          </View>

          {/* スタンプ */}
          {post.counters.reaction_fire_count > 0 && (
            <View style={styles.reactionItem}>
              <Text style={styles.reactionEmoji}>🔥</Text>
              <Text style={styles.reactionCount}>{post.counters.reaction_fire_count}</Text>
            </View>
          )}
          {post.counters.reaction_clap_count > 0 && (
            <View style={styles.reactionItem}>
              <Text style={styles.reactionEmoji}>👏</Text>
              <Text style={styles.reactionCount}>{post.counters.reaction_clap_count}</Text>
            </View>
          )}
          {post.counters.reaction_sparkle_count > 0 && (
            <View style={styles.reactionItem}>
              <Text style={styles.reactionEmoji}>✨</Text>
              <Text style={styles.reactionCount}>{post.counters.reaction_sparkle_count}</Text>
            </View>
          )}
          {post.counters.reaction_muscle_count > 0 && (
            <View style={styles.reactionItem}>
              <Text style={styles.reactionEmoji}>💪</Text>
              <Text style={styles.reactionCount}>{post.counters.reaction_muscle_count}</Text>
            </View>
          )}
        </View>

        {/* メニューボタン */}
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#9E9E9E" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // ユーザー情報バー
  userBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#616161',
  },
  teamGym: {
    fontSize: 12,
    color: '#9E9E9E',
  },

  // 動画エリア
  videoContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  categoryTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 3,
  },
  categoryTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // キャプション
  captionContainer: {
    padding: 12,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  moreButton: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '600',
    marginTop: 4,
  },

  // リアクションバー
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  reactionCounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  menuButton: {
    padding: 4,
  },
});
