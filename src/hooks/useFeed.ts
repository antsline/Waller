import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { FeedPost } from '../types/feed.types';

const PAGE_SIZE = 10;

export function useFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // フィード取得
  const fetchFeed = async (pageNum: number = 0, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      console.log(`📱 Fetching feed: page ${pageNum}, range ${from}-${to}`);

      // 1. postsとusers、countersを取得
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(
          `
          *,
          user:users!inner(
            id,
            username,
            display_name,
            avatar_url,
            role
          ),
          counters:post_counters(
            post_id,
            like_count,
            reaction_fire_count,
            reaction_clap_count,
            reaction_sparkle_count,
            reaction_muscle_count
          )
        `
        )
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('❌ Feed fetch error:', error);
        throw error;
      }

      console.log(`✅ Fetched ${postsData?.length || 0} posts`);

      if (!postsData || postsData.length === 0) {
        setHasMore(false);
        if (isRefresh) {
          setPosts([]);
          setPage(0);
        }
        return;
      }

      // 2. プレーヤーのuser_idを抽出
      const playerUserIds = postsData
        .filter((post: any) => post.user?.role === 'player')
        .map((post: any) => post.user_id);

      // 3. player_profilesを一括取得
      let playerProfiles: any = {};
      if (playerUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('player_profiles')
          .select('*')
          .in('user_id', playerUserIds);

        if (profilesData) {
          playerProfiles = profilesData.reduce((acc: any, profile: any) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {});
        }
      }

      // 4. データの型変換
      const formattedData: FeedPost[] = postsData.map((post: any) => ({
        ...post,
        player_profile: post.user?.role === 'player' ? playerProfiles[post.user_id] || null : null,
        counters: post.counters?.[0] || {
          post_id: post.id,
          like_count: 0,
          reaction_fire_count: 0,
          reaction_clap_count: 0,
          reaction_sparkle_count: 0,
          reaction_muscle_count: 0,
        },
      }));

      if (isRefresh) {
        // リフレッシュ時は置き換え
        setPosts(formattedData);
        setPage(0);
      } else if (pageNum === 0) {
        // 初回読み込み
        setPosts(formattedData);
      } else {
        // 追加読み込み
        setPosts((prev) => [...prev, ...formattedData]);
      }

      // これ以上データがあるかチェック
      setHasMore(formattedData.length === PAGE_SIZE);
    } catch (error) {
      console.error('Feed fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchFeed(0);
  }, []);

  // Pull to Refresh
  const handleRefresh = () => {
    fetchFeed(0, true);
  };

  // ページング（次のページ読み込み）
  const loadMore = () => {
    if (!loading && !refreshing && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  };

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    handleRefresh,
    loadMore,
  };
}
