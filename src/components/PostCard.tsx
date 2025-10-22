import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedPost, CATEGORY_LABELS, SKILL_LEVEL_LABELS } from '../types/feed.types';
import { VideoPlayer } from './VideoPlayer';
import { VideoModal } from './VideoModal';
import { ReactionButtons } from './ReactionButtons';
import { getRelativeTime } from '../utils/formatDate';
import { formatExperience } from '../utils/experience';

interface PostCardProps {
  post: FeedPost;
  onPress?: () => void;
  onUserPress?: () => void;
  onPostDetailPress?: () => void; // 投稿詳細画面への遷移
  isActive?: boolean; // 画面中央に表示されているか（自動再生用）
}

export function PostCard({ post, onPress, onUserPress, onPostDetailPress, isActive = false }: PostCardProps) {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const categoryInfo = post.category_tag ? CATEGORY_LABELS[post.category_tag] : null;

  // 経験年数の表示（例: 1年6ヶ月）
  const experienceText = post.player_profile && post.player_profile.started_at
    ? formatExperience(post.player_profile.started_at)
    : '';

  // スキルレベルの表示
  const skillLevelText = post.player_profile
    ? SKILL_LEVEL_LABELS[post.player_profile.skill_level]
    : '';

  // 投稿日時の相対表示
  const relativeTime = getRelativeTime(post.created_at);

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
            <Text style={styles.timeSeparator}>·</Text>
            <Text style={styles.relativeTime}>{relativeTime}</Text>
          </View>
          {post.player_profile && (
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {skillLevelText} · {experienceText}
                </Text>
              </View>
            </View>
          )}
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
          isActive={isActive}
          initialMuted={isMuted}
          onPress={() => {
            if (onPostDetailPress) {
              onPostDetailPress();
            } else {
              setShowVideoModal(true);
            }
          }}
          onMuteToggle={(muted) => setIsMuted(muted)}
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

      {/* 全画面動画モーダル（フォールバック用） */}
      {!onPostDetailPress && (
        <VideoModal
          visible={showVideoModal}
          videoUrl={post.video_url}
          onClose={() => setShowVideoModal(false)}
        />
      )}

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

      {/* リアクションボタン */}
      <View style={styles.reactionsContainer}>
        <ReactionButtons
          postId={post.id}
          likeCount={post.counters.like_count}
          fireCount={post.counters.reaction_fire_count}
          clapCount={post.counters.reaction_clap_count}
          sparkleCount={post.counters.reaction_sparkle_count}
          muscleCount={post.counters.reaction_muscle_count}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 16,
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
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  timeSeparator: {
    fontSize: 15,
    color: '#9E9E9E',
    marginHorizontal: 6,
  },
  relativeTime: {
    fontSize: 15,
    color: '#9E9E9E',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
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
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
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
    paddingBottom: 8,
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

  // リアクション
  reactionsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
