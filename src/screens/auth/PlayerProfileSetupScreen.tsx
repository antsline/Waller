import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthStackScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useImagePicker } from '../../hooks/useImagePicker';
import { supabase } from '../../services/supabase';

type Props = AuthStackScreenProps<'PlayerProfileSetup'>;

const CURRENT_YEAR = new Date().getFullYear();

// スキルレベルの説明
const SKILL_LEVEL_DESCRIPTIONS: { [key: number]: string } = {
  1: '初心者 - ジャンプや基本姿勢を練習中',
  2: '初級 - バク転、前宙など基本技ができる',
  3: '中級 - ダブルバク、ツイストなど応用技に挑戦中',
  4: '上級 - トリプル、コンボ技を安定して決められる',
  5: 'エキスパート - 大会レベルの高難度技を習得',
};

export function PlayerProfileSetupScreen({ navigation }: Props) {
  const { user, refetchProfile } = useAuth();
  const { imageUri, pickImage } = useImagePicker();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [startDate, setStartDate] = useState(new Date(CURRENT_YEAR, 0, 1)); // 今年の1月1日
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [skillLevel, setSkillLevel] = useState<number | null>(null);
  const [team, setTeam] = useState('');
  const [gym, setGym] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // デバッグ: ユーザー情報を確認
  console.log('👤 PlayerProfileSetupScreen - User:', user?.id, user?.email);

  // @IDのバリデーションと重複チェック
  const validateUsername = async (value: string) => {
    // 形式チェック
    if (value.length === 0) {
      setUsernameError('');
      return false;
    }

    if (value.length < 3 || value.length > 15) {
      setUsernameError('3〜15文字で入力してください');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('英数字と_のみ使用できます');
      return false;
    }

    // 重複チェック
    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', value.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Username check error:', error);
        setUsernameError('チェックに失敗しました');
        return false;
      }

      if (data) {
        setUsernameError('この@IDは既に使用されています');
        return false;
      }

      setUsernameError('');
      return true;
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value.toLowerCase());
    // デバウンス処理（500ms後にチェック）
    setTimeout(() => {
      if (value === username) {
        validateUsername(value);
      }
    }, 500);
  };

  const handleSubmit = async () => {
    // バリデーション
    if (!displayName.trim()) {
      Alert.alert('エラー', '表示名を入力してください');
      return;
    }

    if (!username.trim()) {
      Alert.alert('エラー', '@IDを入力してください');
      return;
    }

    if (usernameError) {
      Alert.alert('エラー', '@IDを確認してください');
      return;
    }

    if (!skillLevel) {
      Alert.alert('エラー', 'スキルレベルを選択してください');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📝 プロフィール登録開始');

      // ユーザー情報を取得（useAuthのuserがまだ更新されていない場合に備えて）
      const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getUser();

      if (sessionError || !currentUser) {
        console.error('❌ セッション取得エラー:', sessionError);
        throw new Error('ユーザー情報が取得できませんでした。再度ログインしてください。');
      }

      console.log('✅ ユーザーID:', currentUser.id);

      // 1. usersテーブル更新
      const { error: userError } = await supabase
        .from('users')
        .update({
          username: username.toLowerCase(),
          display_name: displayName.trim(),
          role: 'player',
          avatar_url: imageUri || null,
        })
        .eq('id', currentUser.id);

      if (userError) {
        console.error('User update error:', userError);
        throw new Error('プロフィールの保存に失敗しました');
      }

      // 2. player_profilesテーブル作成
      const { error: profileError } = await supabase
        .from('player_profiles')
        .insert({
          user_id: currentUser.id,
          started_at: startDate.toISOString().split('T')[0], // YYYY-MM-DD形式
          skill_level: skillLevel,
          team_name: team.trim() || null,
          home_gym: gym.trim() || null,
        });

      if (profileError) {
        console.error('Player profile error:', profileError);
        throw new Error('プレーヤープロフィールの保存に失敗しました');
      }

      console.log('✅ プロフィール登録完了');

      // プロフィールが正しく保存されたか確認
      const { data: savedProfile, error: checkError } = await supabase
        .from('users')
        .select('role, username, display_name')
        .eq('id', currentUser.id)
        .single();

      console.log('🔍 Saved profile check:', savedProfile);

      if (checkError || !savedProfile?.username || !savedProfile?.display_name) {
        console.error('❌ Profile verification failed:', checkError);
        throw new Error('プロフィールの保存確認に失敗しました');
      }

      console.log('✅ プロフィール保存確認完了');

      // 認証状態を手動で再チェック
      await refetchProfile();

      console.log('🎉 プロフィール完了 - ホーム画面に遷移します');
    } catch (error: any) {
      console.error('プロフィール登録エラー:', error);
      Alert.alert('エラー', error.message || '登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    displayName.trim() &&
    username.trim() &&
    !usernameError &&
    skillLevel !== null &&
    !isSubmitting;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>プロフィールを作成</Text>

      {/* アイコン選択 */}
      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>📷</Text>
            <Text style={styles.avatarLabel}>アイコン選択</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.optional}>(任意)</Text>

      {/* 表示名 */}
      <Text style={styles.label}>
        表示名 <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="タケシ"
        maxLength={20}
      />

      {/* @ID */}
      <Text style={styles.label}>
        @ID <Text style={styles.required}>*</Text>
      </Text>
      <View style={[styles.usernameInputContainer, usernameError && styles.inputError]}>
        <Text style={styles.usernamePrefix}>@</Text>
        <TextInput
          style={styles.usernameInput}
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="takeshi_123"
          autoCapitalize="none"
          maxLength={15}
        />
      </View>
      <View style={styles.usernameHelper}>
        {checkingUsername ? (
          <ActivityIndicator size="small" color="#FF6B00" />
        ) : usernameError ? (
          <Text style={styles.errorText}>{usernameError}</Text>
        ) : username.length > 0 ? (
          <Text style={styles.successText}>✓ 使用可能です</Text>
        ) : (
          <Text style={styles.helperText}>英数字と_、3〜15文字</Text>
        )}
      </View>

      {/* 開始年月 */}
      <Text style={styles.label}>
        ウォールトランポリンを始めた時期 <Text style={styles.required}>*</Text>
      </Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          {startDate.getFullYear()}年 {startDate.getMonth() + 1}月
        </Text>
      </TouchableOpacity>
      <Text style={styles.helperText}>
        ※正確な日付がわからない場合は、おおよその月でOKです
      </Text>

      {/* iOS DatePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          locale="ja-JP"
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
          maximumDate={new Date()} // 未来の日付は選択不可
          minimumDate={new Date(2000, 0, 1)} // 2000年から
        />
      )}
      {showDatePicker && Platform.OS === 'ios' && (
        <TouchableOpacity
          style={styles.datePickerDone}
          onPress={() => setShowDatePicker(false)}
        >
          <Text style={styles.datePickerDoneText}>完了</Text>
        </TouchableOpacity>
      )}

      {/* スキルレベル */}
      <Text style={styles.label}>
        スキルレベル <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.skillLevelContainer}>
        {[1, 2, 3, 4, 5].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.skillLevelButton,
              skillLevel === level && styles.skillLevelButtonSelected,
            ]}
            onPress={() => setSkillLevel(level)}
          >
            <Text
              style={[
                styles.skillLevelText,
                skillLevel === level && styles.skillLevelTextSelected,
              ]}
            >
              Lv{level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {skillLevel && (
        <View style={styles.skillLevelDescription}>
          <Text style={styles.skillLevelDescriptionText}>
            {SKILL_LEVEL_DESCRIPTIONS[skillLevel]}
          </Text>
        </View>
      )}
      {!skillLevel && (
        <Text style={styles.helperText}>レベルを選択すると説明が表示されます</Text>
      )}

      {/* 所属チーム */}
      <Text style={styles.label}>所属チーム (任意)</Text>
      <TextInput
        style={styles.input}
        value={team}
        onChangeText={setTeam}
        placeholder="チーム名を入力"
        maxLength={50}
      />

      {/* ホームジム */}
      <Text style={styles.label}>ホームジム (任意)</Text>
      <TextInput
        style={styles.input}
        value={gym}
        onChangeText={setGym}
        placeholder="ジム名を入力"
        maxLength={50}
      />

      {/* 登録ボタン */}
      <TouchableOpacity
        style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!isFormValid}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>登録完了</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  avatarPlaceholderText: {
    fontSize: 32,
  },
  avatarLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  optional: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  required: {
    color: '#F44336',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#F44336',
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 4,
  },
  usernamePrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    paddingLeft: 12,
    paddingRight: 4,
  },
  usernameInput: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
    fontSize: 16,
  },
  usernameHelper: {
    minHeight: 20,
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
  },
  successText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '600',
  },
  datePickerDone: {
    backgroundColor: '#FF6B00',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  datePickerDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skillLevelContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  skillLevelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  skillLevelButtonSelected: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFF5F0',
  },
  skillLevelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  skillLevelTextSelected: {
    color: '#FF6B00',
  },
  skillLevelDescription: {
    backgroundColor: '#FFF5F0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B00',
    marginBottom: 24,
  },
  skillLevelDescriptionText: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#FF6B00',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
