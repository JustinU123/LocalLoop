import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, BrandFonts } from '@/constants/business-theme';

export type LocalLoopLogoSize = 'large' | 'medium' | 'small';

type LocalLoopLogoProps = {
  size?: LocalLoopLogoSize;
  showPin?: boolean;
};

const SIZE_MAP = {
  large: {
    pin: 30,
    local: 42,
    loop: 42,
    gap: 10,
  },
  medium: {
    pin: 24,
    local: 32,
    loop: 32,
    gap: 8,
  },
  small: {
    pin: 18,
    local: 22,
    loop: 22,
    gap: 6,
  },
} as const;

/**
 * Temporary LocalLoop logo placeholder.
 * Replace this component with the final SVG asset when ready.
 */
export function LocalLoopLogo({ size = 'large', showPin = true }: LocalLoopLogoProps) {
  const dimensions = SIZE_MAP[size];

  return (
    <View style={[styles.container, { gap: dimensions.gap }]}>
      {showPin ? (
        <View style={styles.pinWrap}>
          <Ionicons name="location" size={dimensions.pin} color={Brand.emerald} />
        </View>
      ) : null}
      <Text style={styles.wordmark}>
        <Text style={[styles.local, { fontSize: dimensions.local }]}>Local</Text>
        <Text style={[styles.loop, { fontSize: dimensions.loop }]}>Loop</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    textAlign: 'center',
  },
  local: {
    color: Brand.offWhite,
    fontFamily: BrandFonts.bold,
    letterSpacing: -1,
  },
  loop: {
    color: Brand.coral,
    fontFamily: BrandFonts.bold,
    letterSpacing: -1,
  },
});
