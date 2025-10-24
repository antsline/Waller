import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonLoaderProps {
  type?: 'post' | 'profile' | 'grid';
  count?: number;
}

export function SkeletonLoader({ type = 'post', count = 3 }: SkeletonLoaderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (type === 'post') {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <PostCardSkeleton key={index} opacity={opacity} />
        ))}
      </>
    );
  }

  if (type === 'profile') {
    return <ProfileSkeleton opacity={opacity} />;
  }

  if (type === 'grid') {
    return <GridSkeleton opacity={opacity} count={count} />;
  }

  return null;
}

// 投稿カード用スケルトン
function PostCardSkeleton({ opacity }: { opacity: Animated.AnimatedInterpolation<number> }) {
  return (
    <View style={styles.postCard}>
      {/* ユーザー情報バー */}
      <View style={styles.userBar}>
        <Animated.View style={[styles.avatar, { opacity }]} />
        <View style={styles.userInfo}>
          <Animated.View style={[styles.textLine, styles.textLineShort, { opacity }]} />
          <Animated.View style={[styles.textLine, styles.textLineSmall, { opacity }]} />
        </View>
      </View>

      {/* 動画エリア */}
      <Animated.View style={[styles.video, { opacity }]} />

      {/* キャプション */}
      <View style={styles.caption}>
        <Animated.View style={[styles.textLine, styles.textLineMedium, { opacity }]} />
        <Animated.View style={[styles.textLine, styles.textLineShort, { opacity }]} />
      </View>

      {/* リアクションボタン */}
      <View style={styles.reactions}>
        <Animated.View style={[styles.reactionButton, { opacity }]} />
        <Animated.View style={[styles.reactionButton, { opacity }]} />
        <Animated.View style={[styles.reactionButton, { opacity }]} />
      </View>
    </View>
  );
}

// プロフィール用スケルトン
function ProfileSkeleton({ opacity }: { opacity: Animated.AnimatedInterpolation<number> }) {
  return (
    <View style={styles.profile}>
      <View style={styles.profileHeader}>
        <Animated.View style={[styles.profileAvatar, { opacity }]} />
        <View style={styles.profileStats}>
          <Animated.View style={[styles.textLine, styles.textLineShort, { opacity }]} />
          <Animated.View style={[styles.textLine, styles.textLineShort, { opacity }]} />
          <Animated.View style={[styles.textLine, styles.textLineShort, { opacity }]} />
        </View>
      </View>
      <Animated.View style={[styles.textLine, styles.textLineMedium, { opacity }]} />
      <Animated.View style={[styles.textLine, styles.textLineLong, { opacity }]} />
    </View>
  );
}

// グリッド用スケルトン
function GridSkeleton({
  opacity,
  count,
}: {
  opacity: Animated.AnimatedInterpolation<number>;
  count: number;
}) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View key={index} style={[styles.gridItem, { opacity }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // 投稿カード
  postCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  userBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.33,
    backgroundColor: '#E0E0E0',
  },
  caption: {
    padding: 12,
  },
  reactions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  reactionButton: {
    width: 60,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },

  // テキストライン
  textLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  textLineSmall: {
    width: 80,
  },
  textLineShort: {
    width: 120,
  },
  textLineMedium: {
    width: 200,
  },
  textLineLong: {
    width: '80%',
  },

  // プロフィール
  profile: {
    backgroundColor: '#fff',
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
  },
  profileStats: {
    flex: 1,
    marginLeft: 24,
    gap: 8,
  },

  // グリッド
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  gridItem: {
    width: '33.333%',
    aspectRatio: 1,
    padding: 1,
    backgroundColor: '#E0E0E0',
  },
});
