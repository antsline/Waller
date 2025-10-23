import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { CATEGORY_LABELS } from '../../types/feed.types';

interface EditPostModalProps {
  visible: boolean;
  postId: string;
  initialCaption: string;
  initialCategoryTag: string | null;
  onClose: () => void;
  onSaved: () => void;
}

type CategoryTag = 'challenge' | 'success' | 'practice' | 'combo' | 'new' | 'other';

const CATEGORIES: CategoryTag[] = ['challenge', 'success', 'practice', 'combo', 'new', 'other'];

export function EditPostModal({
  visible,
  postId,
  initialCaption,
  initialCategoryTag,
  onClose,
  onSaved,
}: EditPostModalProps) {
  const [caption, setCaption] = useState(initialCaption || '');
  const [categoryTag, setCategoryTag] = useState<CategoryTag | null>(
    (initialCategoryTag as CategoryTag) || null
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      // バリデーション
      if (caption.length > 200) {
        Alert.alert('エラー', 'キャプションは200文字以内で入力してください');
        return;
      }

      // 投稿を更新
      const { error } = await supabase
        .from('posts')
        .update({
          caption: caption.trim() || null,
          category_tag: categoryTag,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;

      Alert.alert('成功', '投稿を更新しました', [
        {
          text: 'OK',
          onPress: () => {
            onSaved();
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error('投稿更新エラー:', error);
      Alert.alert('エラー', '投稿の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // 変更があった場合は確認
    const hasChanges =
      caption !== (initialCaption || '') || categoryTag !== initialCategoryTag;

    if (hasChanges) {
      Alert.alert('確認', '変更を破棄しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '破棄',
          style: 'destructive',
          onPress: onClose,
        },
      ]);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
            <Text style={styles.cancelText}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>投稿を編集</Text>
          <TouchableOpacity
            style={[styles.headerButton, saving && styles.headerButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FF6B00" />
            ) : (
              <Text style={styles.saveText}>保存</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* キャプション */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>キャプション</Text>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="キャプションを入力（任意）"
              placeholderTextColor="#9E9E9E"
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{caption.length} / 200</Text>
          </View>

          {/* カテゴリタグ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>カテゴリタグ</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => {
                const categoryInfo = CATEGORY_LABELS[category];
                const isSelected = categoryTag === category;

                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
                    onPress={() => setCategoryTag(category)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
                    <Text
                      style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}
                    >
                      {categoryInfo.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // ヘッダー
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    minWidth: 70,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  cancelText: {
    fontSize: 16,
    color: '#616161',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B00',
    textAlign: 'right',
  },

  // コンテンツ
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 12,
  },

  // キャプション
  captionInput: {
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 100,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'right',
  },

  // カテゴリタグ
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF6B00',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
  },
  categoryLabelSelected: {
    color: '#FF6B00',
    fontWeight: '600',
  },
});
