import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

export function GlassCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassStroke,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12
  }
});
