import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
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

    // クールダウン中の場合、メッセージを表示
    if (!canChange && currentReaction) {
      Alert.alert(
        'スタンプ変更のクールダウン中',
        `スタンプの変更は${cooldownRemaining}秒後に可能です。\n\n送信後10分以内は自由に変更できます。`,
        [{ text: 'OK' }]
      );
      return;
    }

    sendReaction(type);
  };

  return (
    <View style={styles.container}>
      {/* リアクションボタン（横並び一列） */}
      <View style={styles.reactionsRow}>
        {/* いいねボタン */}
        <TouchableOpacity
          style={styles.likeButton}
          onPress={toggleLike}
          disabled={likeLoading}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={isLiked ? '#F44336' : '#9E9E9E'}
          />
          <Text style={[styles.count, isLiked && styles.countActive]}>{likeCount}</Text>
        </TouchableOpacity>

        {/* スタンプボタン */}
        {REACTIONS.map((reaction) => {
          const isSelected = currentReaction === reaction.type;
          const count = reactionCounts[reaction.type];

          return (
            <TouchableOpacity
              key={reaction.type}
              style={[
                styles.reactionButton,
                isSelected && styles.reactionButtonSelected,
              ]}
              onPress={() => handleReactionPress(reaction.type)}
              disabled={reactionLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              <Text style={[styles.count, isSelected && styles.countSelected]}>
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* クールダウン表示（小さめに） */}
      {cooldownRemaining > 0 && (
        <View style={styles.cooldownContainer}>
          <Ionicons name="time-outline" size={12} color="#FF6B00" />
          <Text style={styles.cooldownText}>
            変更は{cooldownRemaining}秒後に可能
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
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    gap: 4,
    minWidth: 50,
    justifyContent: 'center',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    gap: 3,
    minWidth: 48,
    justifyContent: 'center',
  },
  reactionButtonSelected: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  countActive: {
    color: '#F44336',
  },
  countSelected: {
    color: '#FF6B00',
  },
  cooldownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
  },
  cooldownText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '500',
  },
});
