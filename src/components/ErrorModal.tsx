import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorModal({
  visible,
  title,
  message,
  onClose,
  actionLabel,
  onAction,
}: ErrorModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContainer}>
          {/* アイコン */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="alert-circle" size={48} color="#F44336" />
            </View>
          </View>

          {/* タイトル */}
          <Text style={styles.title}>{title}</Text>

          {/* メッセージ */}
          <Text style={styles.message}>{message}</Text>

          {/* ボタン */}
          <View style={styles.buttonContainer}>
            {actionLabel && onAction ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={onClose}
                >
                  <Text style={styles.secondaryButtonText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => {
                    onAction();
                    onClose();
                  }}
                >
                  <Text style={styles.primaryButtonText}>{actionLabel}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, styles.fullWidthButton]}
                onPress={onClose}
              >
                <Text style={styles.primaryButtonText}>閉じる</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: SCREEN_WIDTH - 64,
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#FF6B00',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#616161',
  },
});
