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
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackScreenProps } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useImagePicker } from '../../hooks/useImagePicker';
import { supabase } from '../../services/supabase';

type Props = AuthStackScreenProps<'FanProfileSetup'>;

export function FanProfileSetupScreen({ navigation }: Props) {
  const { user, refetchProfile } = useAuth();
  const { imageUri, pickImage } = useImagePicker();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    try {
      console.log('📝 ファンプロフィール登録開始');

      // ユーザー情報を取得（useAuthのuserがまだ更新されていない場合に備えて）
      const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getUser();

      if (sessionError || !currentUser) {
        console.error('❌ セッション取得エラー:', sessionError);
        throw new Error('ユーザー情報が取得できませんでした。再度ログインしてください。');
      }

      console.log('✅ ユーザーID:', currentUser.id);

      // usersテーブル更新
      const { error: userError } = await supabase
        .from('users')
        .update({
          username: username.toLowerCase(),
          display_name: displayName.trim(),
          role: 'fan',
          avatar_url: imageUri || null,
          bio: bio.trim() || null,
        })
        .eq('id', currentUser.id);

      if (userError) {
        console.error('User update error:', userError);
        throw new Error('プロフィールの保存に失敗しました');
      }

      console.log('✅ ファンプロフィール登録完了');

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
    displayName.trim() && username.trim() && !usernameError && !isSubmitting;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>プロフィールを作成</Text>
        <Text style={styles.subtitle}>
          後から設定画面でいつでも変更できます
        </Text>

        {/* アイコン選択 */}
      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="camera-outline" size={32} color="#9E9E9E" />
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
        placeholder="ユウキ"
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
          placeholder="yuki_fan"
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
      <Text style={styles.warningText}>※ 一度設定すると変更できません</Text>

      {/* 自己紹介 */}
      <Text style={styles.label}>自己紹介 (任意)</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        value={bio}
        onChangeText={setBio}
        placeholder="あなたのことを教えてください"
        multiline
        maxLength={100}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{bio.length}/100</Text>

      {/* 活動地域 */}
      <Text style={styles.label}>活動地域 (任意)</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="東京都"
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 24,
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
  bioInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  usernameHelper: {
    minHeight: 20,
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
  },
  successText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  warningText: {
    fontSize: 12,
    color: '#FF6B00',
    marginBottom: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'right',
    marginBottom: 24,
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
