import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';
import { InlineError } from '../../components/InlineError';
import { supabase } from '../../services/supabase';
import { MyPageStackScreenProps } from '../../types/navigation';
import { SKILL_LEVEL_LABELS } from '../../types/feed.types';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = MyPageStackScreenProps<'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { user: authUser } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const { toast, showToast, hideToast } = useToast();
  const [saving, setSaving] = useState(false);

  // フォームの状態
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  // エラー状態
  const [displayNameError, setDisplayNameError] = useState('');
  const [bioError, setBioError] = useState('');

  // プレーヤー専用フィールド
  const [skillLevel, setSkillLevel] = useState(1);
  const [startedAt, setStartedAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [homeGym, setHomeGym] = useState('');
  const [mainLocation, setMainLocation] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isOpenToCollab, setIsOpenToCollab] = useState(false);

  const isPlayer = profile?.user.role === 'player';

  // プロフィールデータをフォームに設定
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.user.display_name);
      setUsername(profile.user.username);
      setBio(profile.user.bio || '');
      setAvatarUrl(profile.user.avatar_url);

      if (isPlayer && profile.player_profile) {
        setSkillLevel(profile.player_profile.skill_level);
        setStartedAt(new Date(profile.player_profile.started_at));
        setTeamName(profile.player_profile.team_name || '');
        setHomeGym(profile.player_profile.home_gym || '');
        setMainLocation(profile.player_profile.main_location || '');
        setTwitterUrl(profile.player_profile.twitter_url || '');
        setInstagramUrl(profile.player_profile.instagram_url || '');
        setYoutubeUrl(profile.player_profile.youtube_url || '');
        setIsOpenToCollab(profile.player_profile.is_open_to_collab);
      }
    }
  }, [profile]);

  // 画像選択
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('エラー', '画像ライブラリへのアクセス許可が必要です');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  // 画像アップロード
  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileExt = uri.split('.').pop();
      const fileName = `${authUser!.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('user-content').getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      Alert.alert('エラー', '画像のアップロードに失敗しました');
      return null;
    }
  };

  // バリデーション
  const validate = (): boolean => {
    let isValid = true;
    setDisplayNameError('');
    setBioError('');

    if (!displayName.trim()) {
      setDisplayNameError('表示名を入力してください');
      isValid = false;
    }

    // usernameは変更不可なのでバリデーション不要

    if (bio.length > 200) {
      setBioError('自己紹介は200文字以内で入力してください');
      isValid = false;
    }

    if (isPlayer) {
      if (teamName.length > 30) {
        showToast('チーム名は30文字以内で入力してください', 'warning');
        isValid = false;
      }

      if (homeGym.length > 30) {
        showToast('ジム名は30文字以内で入力してください', 'warning');
        isValid = false;
      }

      if (mainLocation.length > 30) {
        showToast('活動地域は30文字以内で入力してください', 'warning');
        isValid = false;
      }
    }

    return isValid;
  };

  // 保存処理
  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      // 画像アップロード（新しい画像が選択されている場合）
      let newAvatarUrl = avatarUrl;
      if (localImageUri) {
        const uploadedUrl = await uploadImage(localImageUri);
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl;
        }
      }

      // ユーザー情報の更新
      const { error: userError } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          username: username,
          bio: bio || null,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser!.id);

      if (userError) throw userError;

      // プレーヤープロフィールの更新
      if (isPlayer) {
        const { error: profileError } = await supabase
          .from('player_profiles')
          .update({
            skill_level: skillLevel,
            started_at: startedAt.toISOString(),
            team_name: teamName || null,
            home_gym: homeGym || null,
            main_location: mainLocation || null,
            twitter_url: twitterUrl || null,
            instagram_url: instagramUrl || null,
            youtube_url: youtubeUrl || null,
            is_open_to_collab: isOpenToCollab,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', authUser!.id);

        if (profileError) throw profileError;
      }

      // プロフィールを再取得
      await refetch();

      showToast('プロフィールを更新しました', 'success');

      // 少し待ってから戻る
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error: any) {
      console.error('プロフィール更新エラー:', error);
      showToast(error.message || 'プロフィールの更新に失敗しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 日付ピッカーの変更ハンドラー
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartedAt(selectedDate);
    }
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      </SafeAreaView>
    );
  }

  const displayAvatar = localImageUri || avatarUrl;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="close" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>プロフィール編集</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#FF6B00" />
          ) : (
            <Text style={styles.saveButton}>保存</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* アバター */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プロフィール写真</Text>
          <TouchableOpacity style={styles.avatarButton} onPress={handlePickImage}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={48} color="#9E9E9E" />
              </View>
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 基本情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              表示名 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, displayNameError && styles.inputError]}
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                setDisplayNameError('');
              }}
              placeholder="山田太郎"
              maxLength={20}
            />
            <InlineError message={displayNameError} visible={!!displayNameError} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              ユーザーネーム
            </Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyPrefix}>@</Text>
              <Text style={styles.readOnlyText}>{username}</Text>
            </View>
            <Text style={styles.hint}>※ ユーザーネームは変更できません</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>自己紹介</Text>
            <TextInput
              style={[styles.input, styles.textArea, bioError && styles.inputError]}
              value={bio}
              onChangeText={(text) => {
                setBio(text);
                setBioError('');
              }}
              placeholder="自己紹介を入力してください"
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
            <InlineError message={bioError} visible={!!bioError} />
          </View>
        </View>

        {/* プレーヤー専用フィールド */}
        {isPlayer && (
          <>
            {/* スキルレベル */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>スキル情報</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  スキルレベル <Text style={styles.required}>*</Text>
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.skillLevelContainer}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.skillLevelButton,
                          skillLevel === level && styles.skillLevelButtonActive,
                        ]}
                        onPress={() => setSkillLevel(level)}
                      >
                        <Text
                          style={[
                            styles.skillLevelText,
                            skillLevel === level && styles.skillLevelTextActive,
                          ]}
                        >
                          {SKILL_LEVEL_LABELS[level]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  開始時期 <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {startedAt.getFullYear()}年{startedAt.getMonth() + 1}月
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#616161" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={startedAt}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>
            </View>

            {/* 活動情報 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>活動情報</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>チーム名</Text>
                <TextInput
                  style={styles.input}
                  value={teamName}
                  onChangeText={setTeamName}
                  placeholder="Team WALLER"
                  maxLength={30}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>メインのジム</Text>
                <TextInput
                  style={styles.input}
                  value={homeGym}
                  onChangeText={setHomeGym}
                  placeholder="○○トランポリンパーク"
                  maxLength={30}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>活動地域</Text>
                <TextInput
                  style={styles.input}
                  value={mainLocation}
                  onChangeText={setMainLocation}
                  placeholder="東京都渋谷区"
                  maxLength={30}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>一緒に練習歓迎</Text>
                  <Switch
                    value={isOpenToCollab}
                    onValueChange={setIsOpenToCollab}
                    trackColor={{ false: '#E0E0E0', true: '#FFE0CC' }}
                    thumbColor={isOpenToCollab ? '#FF6B00' : '#fff'}
                  />
                </View>
                <Text style={styles.hint}>
                  他のプレーヤーとのコラボや一緒に練習することを歓迎する場合にオンにしてください
                </Text>
              </View>
            </View>

            {/* SNSリンク */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SNSリンク</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>X (Twitter)</Text>
                <TextInput
                  style={styles.input}
                  value={twitterUrl}
                  onChangeText={setTwitterUrl}
                  placeholder="https://twitter.com/username"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Instagram</Text>
                <TextInput
                  style={styles.input}
                  value={instagramUrl}
                  onChangeText={setInstagramUrl}
                  placeholder="https://instagram.com/username"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>YouTube</Text>
                <TextInput
                  style={styles.input}
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                  placeholder="https://youtube.com/@username"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerButton: {
    padding: 4,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B00',
  },

  // アバター
  avatarButton: {
    alignSelf: 'center',
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },

  // セクション
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },

  // 入力フィールド
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B00',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: '#F44336',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  readOnlyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9E9E9E',
    marginRight: 4,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  charCount: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'right',
    marginTop: 4,
  },

  // スキルレベル
  skillLevelContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  skillLevelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  skillLevelButtonActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF6B00',
  },
  skillLevelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
  },
  skillLevelTextActive: {
    color: '#FF6B00',
    fontWeight: '600',
  },

  // 日付ボタン
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
  },

  // スイッチ
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // パディング
  bottomPadding: {
    height: 32,
  },
});
