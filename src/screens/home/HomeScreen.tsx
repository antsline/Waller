import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  ViewToken,
} from 'react-native';
import { HomeStackScreenProps } from '../../types/navigation';
import { useFeed } from '../../hooks/useFeed';
import { PostCard } from '../../components/PostCard';
import { FeedPost } from '../../types/feed.types';

type Props = HomeStackScreenProps<'HomeFeed'>;

export function HomeScreen({ navigation }: Props) {
  const { posts, loading, refreshing, hasMore, handleRefresh, loadMore } = useFeed();
  const [activePostId, setActivePostId] = useState<string | null>(null);

  // 表示中の投稿を検出するコールバック
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        // 最も画面中央に近い投稿を探す
        const centerItem = viewableItems.reduce((closest, current) => {
          if (!current.item || !closest.item) return current;

          const currentVisibility = current.itemVisiblePercentThreshold || 0;
          const closestVisibility = closest.itemVisiblePercentThreshold || 0;

          return currentVisibility > closestVisibility ? current : closest;
        });

        if (centerItem.item) {
          setActivePostId((centerItem.item as FeedPost).id);
        }
      } else {
        setActivePostId(null);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // 50%以上表示されていると判定
    minimumViewTime: 100, // 100ms以上表示されていると判定
  }).current;

  const renderItem = ({ item }: { item: FeedPost }) => (
    <PostCard
      post={item}
      isActive={activePostId === item.id}
      onPostDetailPress={() => {
        navigation.navigate('PostDetail', { postId: item.id });
      }}
      onUserPress={() => {
        // TODO: プロフィール画面への遷移
        console.log('User pressed:', item.user.id);
      }}
    />
  );

  const renderFooter = () => {
    if (!hasMore) {
      return (
        <View style={styles.footerText}>
          <Text style={styles.endMessage}>すべての投稿を表示しました</Text>
        </View>
      );
    }

    if (loading && posts.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#FF6B00" />
        </View>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>まだ投稿がありません</Text>
        <Text style={styles.emptySubtitle}>
          最初の投稿をしてWallerコミュニティを盛り上げよう！
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Waller 🔥</Text>
        </View>

        {/* フィード */}
        {loading && posts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingText}>投稿を読み込んでいます...</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#FF6B00"
                colors={['#FF6B00']}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // ヘッダー
  header: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },

  // リスト
  listContent: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // ローディング
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9E9E9E',
  },

  // フッター
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endMessage: {
    fontSize: 14,
    color: '#9E9E9E',
  },

  // 空状態
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 20,
  },
});
