import { StyleSheet, View, type ViewStyle } from 'react-native';

import type { AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

/** Non-text stand-in for future metric values (never shows fake numbers). */
export function ObscuredBlock({
  width = '100%',
  height = 10,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
}) {
  const styles = useThemedStyles(createObscuredStyles);

  return <View style={[styles.block, { width, height }, style]} />;
}

function createObscuredStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    block: {
      borderRadius: 4,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    },
  });
}
