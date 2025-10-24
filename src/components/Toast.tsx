import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
}

const TOAST_CONFIG = {
  success: {
    backgroundColor: '#4CAF50',
    icon: 'checkmark-circle' as const,
    iconColor: '#fff',
  },
  error: {
    backgroundColor: '#F44336',
    icon: 'close-circle' as const,
    iconColor: '#fff',
  },
  info: {
    backgroundColor: '#2196F3',
    icon: 'information-circle' as const,
    iconColor: '#fff',
  },
  warning: {
    backgroundColor: '#FF9800',
    icon: 'warning' as const,
    iconColor: '#fff',
  },
};

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  const config = TOAST_CONFIG[type];

  useEffect(() => {
    if (visible) {
      // スライドイン & フェードイン
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // 自動非表示
      timeoutRef.current = setTimeout(() => {
        handleHide();
      }, duration);
    } else {
      // スライドアウト & フェードアウト
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 20,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.toast, { backgroundColor: config.backgroundColor }]}
        onPress={handleHide}
        activeOpacity={0.9}
      >
        <Ionicons name={config.icon} size={24} color={config.iconColor} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: SCREEN_WIDTH - 32,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 20,
  },
});
