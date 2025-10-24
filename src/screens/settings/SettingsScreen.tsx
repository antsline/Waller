import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { MyPageStackScreenProps } from '../../types/navigation';

type Props = MyPageStackScreenProps<'Settings'>;

const APP_VERSION = '1.0.0';
const TERMS_URL = 'https://antsline.github.io/Waller/terms.html';
const PRIVACY_URL = 'https://antsline.github.io/Waller/privacy.html';
const CONTACT_URL = 'https://forms.gle/example'; // TODO: Googleフォームなどを作成してURLを設定

export function SettingsScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // プロフィール編集画面へ遷移
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  // WebView画面に遷移
  const handleOpenWebView = (url: string, title: string) => {
    navigation.navigate('WebView', { url, title });
  };

  // 外部リンクを開く（お問い合わせ用）
  const handleOpenExternalLink = async (url: string, title: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('エラー', `${title}を開けませんでした`);
      }
    } catch (error) {
      console.error('リンクを開くエラー:', error);
      Alert.alert('エラー', `${title}を開けませんでした`);
    }
  };

  // ログアウト
  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await signOut();
              // signOutが成功すると、useAuthのisAuthenticatedがfalseになり、
              // RootNavigatorが自動的にAuthStackに切り替わる
            } catch (error) {
              console.error('ログアウトエラー:', error);
              Alert.alert('エラー', 'ログアウトに失敗しました');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  // アカウント削除（第1段階確認）
  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウント削除',
      'アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除する',
          style: 'destructive',
          onPress: handleDeleteAccountConfirm,
        },
      ]
    );
  };

  // アカウント削除（第2段階確認）
  const handleDeleteAccountConfirm = () => {
    Alert.alert(
      '本当に削除しますか？',
      '投稿、いいね、フォロー情報などすべてのデータが削除されます。本当によろしいですか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '完全に削除',
          style: 'destructive',
          onPress: executeDeleteAccount,
        },
      ]
    );
  };

  // アカウント削除実行
  const executeDeleteAccount = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);

      // ユーザーデータを削除（CASCADE設定により関連データも削除される）
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (deleteError) throw deleteError;

      // Supabase Authからユーザーを削除
      // 注意: これはクライアントサイドからは実行できない場合がある
      // その場合は、サーバーサイド（Cloud Functions等）で実装する必要がある

      Alert.alert(
        '削除完了',
        'アカウントが削除されました。ご利用ありがとうございました。',
        [
          {
            text: 'OK',
            onPress: async () => {
              // ログアウト処理
              await signOut();
            },
          },
        ]
      );
    } catch (error) {
      console.error('アカウント削除エラー:', error);
      Alert.alert('エラー', 'アカウント削除に失敗しました。もう一度お試しください。');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>設定</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* アカウントセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <Text style={styles.menuItemText}>プロフィール編集</Text>
              <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* サポートセクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>サポート</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleOpenWebView(TERMS_URL, '利用規約')}
            >
              <Text style={styles.menuItemText}>利用規約</Text>
              <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleOpenWebView(PRIVACY_URL, 'プライバシーポリシー')}
            >
              <Text style={styles.menuItemText}>プライバシーポリシー</Text>
              <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleOpenExternalLink(CONTACT_URL, 'お問い合わせ')}
            >
              <Text style={styles.menuItemText}>お問い合わせ</Text>
              <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* その他セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>その他</Text>
          <View style={styles.menuGroup}>
            <View style={styles.menuItem}>
              <Text style={styles.menuItemText}>バージョン</Text>
              <Text style={styles.versionText}>{APP_VERSION}</Text>
            </View>
          </View>
        </View>

        {/* ログアウトボタン */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#1A1A1A" />
            ) : (
              <Text style={styles.logoutButtonText}>ログアウト</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* アカウント削除ボタン */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#F44336" />
            ) : (
              <Text style={styles.deleteButtonText}>アカウント削除</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 32,
  },

  // セクション
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9E9E9E',
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // メニューグループ
  menuGroup: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginLeft: 16,
  },
  versionText: {
    fontSize: 16,
    color: '#9E9E9E',
  },

  // ログアウトボタン
  logoutButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // アカウント削除ボタン
  deleteButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },

  // パディング
  bottomPadding: {
    height: 32,
  },
});
