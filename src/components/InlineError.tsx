import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InlineErrorProps {
  message: string;
  visible?: boolean;
}

export function InlineError({ message, visible = true }: InlineErrorProps) {
  if (!visible || !message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={16} color="#F44336" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 8,
    marginTop: 8,
  },
  message: {
    flex: 1,
    fontSize: 13,
    color: '#C62828',
    lineHeight: 18,
  },
});
