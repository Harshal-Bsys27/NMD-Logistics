import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function InlineError({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  if (!message) return null;

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onDismiss && (
        <Pressable accessibilityRole="button" onPress={onDismiss} hitSlop={10}>
          <Text style={styles.dismiss}>Dismiss</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
    backgroundColor: colors.paleRed,
    padding: 14,
  },
  message: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  dismiss: {
    alignSelf: 'flex-start',
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
