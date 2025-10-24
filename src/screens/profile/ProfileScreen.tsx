import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useUserPosts } from '../../hooks/useUserPosts';
import { useLikedPosts } from '../../hooks/useLikedPosts';
import { SKILL_LEVEL_LABELS } from '../../types/feed.types';
import { formatExperience } from '../../utils/experience';
import { MyPageStackScreenProps } from '../../types/navigation';

interface ProfileScreenProps {
  userId?: string; // 指定しない場合は自分のプロフィール
  navigation?: MyPageStackScreenProps<'MyPageProfile'>['navigation']; // 自分のプロフィールの場合のみ
  showBackButton?: boolean; // 戻るボタンを表示するか
  onBackPress?: () => void; // 戻るボタンが押されたときのコールバック
  onPostPress?: (postId: string) => void; // 投稿がタップされたときのコールバック
}

export function ProfileScreen({ userId, navigation, showBackButton, onBackPress, onPostPress }: ProfileScreenProps) {
  const { user: authUser } = useAuth();
  const { profile, loading, error } = useProfile(userId);
  const [selectedTab, setSelectedTab] = useState<'posts' | 'liked'>('posts');
  const [showFullBio, setShowFullBio] = useState(false);

  // 自分のプロフィールかどうか
  const isOwnProfile = !userId || userId === authUser?.id;

  // 投稿データ取得
  const targetUserId = userId || authUser?.id;
  const { posts: userPosts, loading: postsLoading } = useUserPosts(targetUserId);
  const { posts: likedPosts, loading: likedLoading } = useLikedPosts(isOwnProfile ? targetUserId : undefined);

  // 表示する投稿リスト
  const displayPosts = selectedTab === 'posts' ? userPosts : likedPosts;
  const isPostsLoading = selectedTab === 'posts' ? postsLoading : likedLoading;

  const handleSNSLink = async (url: string | null) => {
    if (!url) return;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const handleEditProfile = () => {
    if (navigation) {
      navigation.navigate('EditProfile');
    }
  };

  const handleSettings = () => {
    if (navigation) {
      navigation.navigate('Settings');
    }
  };

  // ローディング中
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      </SafeAreaView>
    );
  }

  // エラー時
  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#9E9E9E" />
          <Text style={styles.errorText}>{error || 'プロフィールが見つかりません'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 自己紹介の表示制御
  const bio = profile.user.bio || '';
  const shouldTruncate = bio.length > 100;
  const displayBio = shouldTruncate && !showFullBio ? bio.slice(0, 100) + '...' : bio;

  // 経験年数の表示
  const experienceText = profile.player_profile?.started_at
    ? formatExperience(profile.player_profile.started_at)
    : '';

  // スキルレベルの表示
  const skillLevelText = profile.player_profile
    ? SKILL_LEVEL_LABELS[profile.player_profile.skill_level]
    : '';

  const isPlayer = profile.user.role === 'player';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          {showBackButton && onBackPress ? (
            <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          <Text style={styles.headerTitle}>プロフィール</Text>
          {isOwnProfile ? (
            <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
              <Ionicons name="settings-outline" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {/* プロフィール情報 */}
        <View style={styles.profileSection}>
          {/* アバターと基本情報 */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profile.user.avatar_url ? (
                <Image source={{ uri: profile.user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={40} color="#9E9E9E" />
                </View>
              )}
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.posts_count}</Text>
                <Text style={styles.statLabel}>投稿</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.followers_count}</Text>
                <Text style={styles.statLabel}>フォロワー</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.following_count}</Text>
                <Text style={styles.statLabel}>フォロー中</Text>
              </View>
            </View>
          </View>

          {/* 名前とユーザーネーム */}
          <Text style={styles.displayName}>{profile.user.display_name}</Text>
          <Text style={styles.username}>@{profile.user.username}</Text>

          {/* スキルレベル・経験年数（プレーヤーのみ） */}
          {isPlayer && profile.player_profile && (
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {skillLevelText} · {experienceText}
                </Text>
              </View>
            </View>
          )}

          {/* コラボ歓迎バッジ */}
          {isPlayer && profile.player_profile?.is_open_to_collab && (
            <View style={styles.collabBadge}>
              <Ionicons name="people" size={16} color="#FF6B00" />
              <Text style={styles.collabBadgeText}>一緒に練習歓迎！</Text>
            </View>
          )}

          {/* チーム/ジム/活動地域 */}
          {isPlayer && profile.player_profile && (
            <View style={styles.infoContainer}>
              {profile.player_profile.team_name && (
                <View style={styles.infoRow}>
                  <Ionicons name="shield-outline" size={16} color="#616161" />
                  <Text style={styles.infoText}>{profile.player_profile.team_name}</Text>
                </View>
              )}
              {profile.player_profile.home_gym && (
                <View style={styles.infoRow}>
                  <Ionicons name="fitness-outline" size={16} color="#616161" />
                  <Text style={styles.infoText}>{profile.player_profile.home_gym}</Text>
                </View>
              )}
              {profile.player_profile.main_location && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color="#616161" />
                  <Text style={styles.infoText}>{profile.player_profile.main_location}</Text>
                </View>
              )}
            </View>
          )}

          {/* 自己紹介 */}
          {bio && (
            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>{displayBio}</Text>
              {shouldTruncate && (
                <TouchableOpacity onPress={() => setShowFullBio(!showFullBio)}>
                  <Text style={styles.bioMore}>
                    {showFullBio ? '閉じる' : 'もっと見る'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* SNSリンク */}
          {isPlayer && profile.player_profile && (
            <View style={styles.snsContainer}>
              {profile.player_profile.twitter_url && (
                <TouchableOpacity
                  style={styles.snsButton}
                  onPress={() => handleSNSLink(profile.player_profile?.twitter_url || null)}
                >
                  <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                </TouchableOpacity>
              )}
              {profile.player_profile.instagram_url && (
                <TouchableOpacity
                  style={styles.snsButton}
                  onPress={() => handleSNSLink(profile.player_profile?.instagram_url || null)}
                >
                  <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                </TouchableOpacity>
              )}
              {profile.player_profile.youtube_url && (
                <TouchableOpacity
                  style={styles.snsButton}
                  onPress={() => handleSNSLink(profile.player_profile?.youtube_url || null)}
                >
                  <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* プロフィール編集ボタン（自分のプロフィールのみ） */}
          {isOwnProfile && (
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Text style={styles.editButtonText}>プロフィールを編集</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* タブ（自分のプロフィールのみ） */}
        {isOwnProfile && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'posts' && styles.tabActive]}
              onPress={() => setSelectedTab('posts')}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color={selectedTab === 'posts' ? '#FF6B00' : '#9E9E9E'}
              />
              <Text style={[styles.tabText, selectedTab === 'posts' && styles.tabTextActive]}>
                投稿
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'liked' && styles.tabActive]}
              onPress={() => setSelectedTab('liked')}
            >
              <Ionicons
                name="heart-outline"
                size={20}
                color={selectedTab === 'liked' ? '#FF6B00' : '#9E9E9E'}
              />
              <Text style={[styles.tabText, selectedTab === 'liked' && styles.tabTextActive]}>
                いいね
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 投稿グリッド */}
        <View style={styles.gridContainer}>
          {isPostsLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#FF6B00" />
            </View>
          ) : displayPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>
                {selectedTab === 'posts' ? 'まだ投稿がありません' : 'まだいいねした投稿がありません'}
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {displayPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.gridItem}
                  onPress={() => onPostPress?.(post.id)}
                  activeOpacity={0.8}
                >
                  {post.thumbnail_url ? (
                    <Image source={{ uri: post.thumbnail_url }} style={styles.gridItemImage} />
                  ) : (
                    <View style={styles.gridItemPlaceholder}>
                      <Ionicons name="play-circle" size={40} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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

  // ローディング・エラー
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginTop: 16,
    textAlign: 'center',
  },

  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  settingsButton: {
    padding: 4,
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 32,
  },

  // プロフィールセクション
  profileSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },

  // 名前・ユーザーネーム
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 12,
  },

  // バッジ
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B00',
  },

  // コラボ歓迎バッジ
  collabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  collabBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // 情報行
  infoContainer: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
  },

  // 自己紹介
  bioContainer: {
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  bioMore: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '600',
    marginTop: 4,
  },

  // SNSリンク
  snsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  snsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 編集ボタン
  editButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // タブ
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF6B00',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9E9E9E',
  },
  tabTextActive: {
    color: '#FF6B00',
    fontWeight: '600',
  },

  // グリッド
  gridContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  gridItem: {
    width: '33.333%',
    aspectRatio: 1,
    padding: 1,
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  gridItemPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ローディング状態
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },

  // 空状態
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 12,
  },
});
