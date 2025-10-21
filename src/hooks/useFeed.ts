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
      const formattedData: FeedPost[] = postsData.map((post: any) => {
        // countersは配列またはオブジェクトで返ってくる可能性があるため、両方に対応
        let counters;
        if (Array.isArray(post.counters)) {
          counters = post.counters[0];
        } else if (post.counters && typeof post.counters === 'object') {
          counters = post.counters;
        }

        return {
          ...post,
          player_profile: post.user?.role === 'player' ? playerProfiles[post.user_id] || null : null,
          counters: counters || {
            post_id: post.id,
            like_count: 0,
            reaction_fire_count: 0,
            reaction_clap_count: 0,
            reaction_sparkle_count: 0,
            reaction_muscle_count: 0,
          },
        };
      });

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

  // リアルタイム更新（post_countersの変更を監視）
  useEffect(() => {
    console.log('🔔 Setting up realtime subscription for post_counters');

    const subscription = supabase
      .channel('post_counters_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_counters',
        },
        (payload) => {
          console.log('📊 Counter update received:', JSON.stringify(payload, null, 2));
          console.log('📊 New counters:', payload.new);

          // 該当する投稿のカウンターを更新
          setPosts((currentPosts) => {
            console.log(`🔄 Updating post ${payload.new?.post_id} in ${currentPosts.length} posts`);
            return currentPosts.map((post) => {
              if (post.id === payload.new?.post_id) {
                console.log('✅ Found matching post, updating counters');
                return {
                  ...post,
                  counters: {
                    post_id: payload.new.post_id,
                    like_count: payload.new.like_count,
                    reaction_fire_count: payload.new.reaction_fire_count,
                    reaction_clap_count: payload.new.reaction_clap_count,
                    reaction_sparkle_count: payload.new.reaction_sparkle_count,
                    reaction_muscle_count: payload.new.reaction_muscle_count,
                  },
                };
              }
              return post;
            });
          });
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
      });

    return () => {
      console.log('🔕 Unsubscribing from post_counters changes');
      subscription.unsubscribe();
    };
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
