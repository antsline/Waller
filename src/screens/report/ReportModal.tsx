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
import { useAuth } from '../../hooks/useAuth';

interface ReportModalProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
}

type ReportReason = 'inappropriate' | 'spam' | 'harassment' | 'impersonation' | 'other';

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'inappropriate',
    label: '不適切なコンテンツ',
    description: '暴力的・性的な内容',
  },
  {
    value: 'spam',
    label: 'スパム・宣伝',
    description: '',
  },
  {
    value: 'harassment',
    label: '嫌がらせ・誹謗中傷',
    description: '',
  },
  {
    value: 'impersonation',
    label: 'なりすまし',
    description: '',
  },
  {
    value: 'other',
    label: 'その他',
    description: '',
  },
];

export function ReportModal({ visible, postId, onClose }: ReportModalProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [reasonDetail, setReasonDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !selectedReason) return;

    // 「その他」選択時は詳細入力が必須
    if (selectedReason === 'other' && !reasonDetail.trim()) {
      Alert.alert('入力エラー', '「その他」を選択した場合は、詳細を入力してください');
      return;
    }

    try {
      setSubmitting(true);

      // 通報を送信
      const { error } = await supabase.from('reports').insert({
        post_id: postId,
        reporter_user_id: user.id,
        reason: selectedReason,
        reason_detail: reasonDetail.trim() || null,
      });

      if (error) {
        // ユニーク制約違反（既に通報済み）の場合
        if (error.code === '23505') {
          Alert.alert('通報済み', 'この投稿は既に通報済みです');
        } else {
          console.error('通報送信エラー:', error);
          Alert.alert('エラー', '通報の送信に失敗しました');
        }
        return;
      }

      // 成功時
      Alert.alert('通報完了', '通報を受け付けました。ご協力ありがとうございます。', [
        {
          text: 'OK',
          onPress: () => {
            // 状態をリセットして閉じる
            setSelectedReason(null);
            setReasonDetail('');
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error('通報処理エラー:', error);
      Alert.alert('エラー', '予期しないエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // 入力内容がある場合は確認
    if (selectedReason || reasonDetail.trim()) {
      Alert.alert('確認', '入力内容を破棄しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '破棄',
          style: 'destructive',
          onPress: () => {
            setSelectedReason(null);
            setReasonDetail('');
            onClose();
          },
        },
      ]);
    } else {
      onClose();
    }
  };

  const canSubmit = selectedReason !== null && !submitting;

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
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>この投稿を通報</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 説明 */}
          <Text style={styles.description}>理由を選択してください</Text>

          {/* 通報理由選択 */}
          <View style={styles.reasonsContainer}>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonButton,
                  selectedReason === reason.value && styles.reasonButtonSelected,
                ]}
                onPress={() => setSelectedReason(reason.value)}
                activeOpacity={0.7}
              >
                <View style={styles.radioButton}>
                  {selectedReason === reason.value ? (
                    <View style={styles.radioButtonInner} />
                  ) : null}
                </View>
                <View style={styles.reasonTextContainer}>
                  <Text
                    style={[
                      styles.reasonLabel,
                      selectedReason === reason.value && styles.reasonLabelSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                  {reason.description && (
                    <Text style={styles.reasonDescription}>{reason.description}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 詳細入力 */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>
              詳細 {selectedReason === 'other' ? '（必須）' : '（任意）'}
            </Text>
            <TextInput
              style={styles.detailInput}
              value={reasonDetail}
              onChangeText={setReasonDetail}
              placeholder="具体的な内容を入力してください"
              placeholderTextColor="#9E9E9E"
              multiline
              maxLength={100}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{reasonDetail.length} / 100</Text>
          </View>

          {/* 注意書き */}
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#616161" />
            <Text style={styles.noteText}>
              通報内容は匿名で運営に送信されます
            </Text>
          </View>
        </ScrollView>

        {/* 通報ボタン */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>通報する</Text>
            )}
          </TouchableOpacity>
        </View>
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
  closeButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerSpacer: {
    minWidth: 40,
  },

  // コンテンツ
  content: {
    flex: 1,
  },
  description: {
    fontSize: 15,
    color: '#616161',
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },

  // 通報理由
  reasonsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonButtonSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF6B00',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9E9E9E',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B00',
  },
  reasonTextContainer: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  reasonLabelSelected: {
    color: '#FF6B00',
    fontWeight: '600',
  },
  reasonDescription: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 2,
  },

  // 詳細入力
  detailSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 8,
  },
  detailInput: {
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

  // 注意書き
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#616161',
    lineHeight: 18,
  },

  // フッター
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
