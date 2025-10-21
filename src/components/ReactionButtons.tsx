import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLike } from '../hooks/useLike';
import { useReaction, ReactionType } from '../hooks/useReaction';

interface ReactionButtonsProps {
  postId: string;
  likeCount: number;
  fireCount: number;
  clapCount: number;
  sparkleCount: number;
  muscleCount: number;
}

const REACTIONS = [
  { type: 'fire' as ReactionType, emoji: '🔥', label: 'やばい' },
  { type: 'clap' as ReactionType, emoji: '👏', label: 'ナイス' },
  { type: 'sparkle' as ReactionType, emoji: '✨', label: 'きれい' },
  { type: 'muscle' as ReactionType, emoji: '💪', label: 'チャレンジ' },
];

export function ReactionButtons({
  postId,
  likeCount,
  fireCount,
  clapCount,
  sparkleCount,
  muscleCount,
}: ReactionButtonsProps) {
  const { isLiked, toggleLike, isLoading: likeLoading } = useLike(postId);
  const {
    currentReaction,
    sendReaction,
    isLoading: reactionLoading,
    cooldownRemaining,
    canChange,
  } = useReaction(postId);

  const reactionCounts = {
    fire: fireCount,
    clap: clapCount,
    sparkle: sparkleCount,
    muscle: muscleCount,
  };

  const handleReactionPress = (type: ReactionType) => {
    if (currentReaction === type) {
      // 同じスタンプをもう一度押したら削除はしない（仕様上、削除ボタンは別途必要な場合のみ）
      return;
    }
    sendReaction(type);
  };

  return (
    <View style={styles.container}>
      {/* いいねボタン */}
      <TouchableOpacity
        style={styles.likeButton}
        onPress={toggleLike}
        disabled={likeLoading}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={24}
          color={isLiked ? '#F44336' : '#9E9E9E'}
        />
        {likeCount > 0 && <Text style={styles.count}>{likeCount}</Text>}
      </TouchableOpacity>

      {/* スタンプボタン */}
      <View style={styles.reactionButtons}>
        {REACTIONS.map((reaction) => {
          const isSelected = currentReaction === reaction.type;
          const count = reactionCounts[reaction.type];

          return (
            <TouchableOpacity
              key={reaction.type}
              style={[
                styles.reactionButton,
                isSelected && styles.reactionButtonSelected,
                !canChange && isSelected && styles.reactionButtonCooldown,
              ]}
              onPress={() => handleReactionPress(reaction.type)}
              disabled={reactionLoading || (!canChange && !isSelected)}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              {count > 0 && (
                <Text style={[styles.count, isSelected && styles.countSelected]}>
                  {count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* クールダウン表示 */}
      {cooldownRemaining > 0 && (
        <View style={styles.cooldownContainer}>
          <Ionicons name="time-outline" size={14} color="#FF6B00" />
          <Text style={styles.cooldownText}>
            スタンプの変更は{cooldownRemaining}秒後に可能です
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  reactionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    gap: 4,
    minWidth: 50,
    justifyContent: 'center',
  },
  reactionButtonSelected: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  reactionButtonCooldown: {
    opacity: 0.6,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  count: {
    fontSize: 13,
    fontWeight: '600',
    color: '#616161',
  },
  countSelected: {
    color: '#FF6B00',
  },
  cooldownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    gap: 6,
  },
  cooldownText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
});
