import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export function Spinner({
  size = 'large',
  color = '#FF6B00',
  message,
  fullScreen = false,
}: SpinnerProps) {
  const content = (
    <>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </>
  );

  if (fullScreen) {
    return <View style={styles.fullScreenContainer}>{content}</View>;
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});
