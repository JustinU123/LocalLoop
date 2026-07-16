import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BrandFonts } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';

export const HEADER_WORDMARK_SIZE = 22;
export const HEADER_WORDMARK_LINE_HEIGHT = 26;

type LocalLoopWordmarkProps = {
  style?: StyleProp<ViewStyle>;
};

/**
 * Small top-left header wordmark for main app screens only.
 * Do not use on splash, login, sign up, or large centered logo placements.
 */
export function LocalLoopWordmark({ style }: LocalLoopWordmarkProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.wordmark} accessibilityLabel="LocalLoop">
        <Text style={[styles.local, { color: theme.text }]}>Local</Text>
        <Text style={[styles.loop, { color: theme.coral }]}>Loop</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
  },
  wordmark: {
    fontSize: HEADER_WORDMARK_SIZE,
    lineHeight: HEADER_WORDMARK_LINE_HEIGHT,
    fontFamily: BrandFonts.bold,
  },
  local: {
    letterSpacing: 0,
  },
  loop: {
    letterSpacing: -0.5,
  },
});
