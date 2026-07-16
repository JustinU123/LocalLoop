import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const headerLogo = require('@/assets/images/localloop-header-logo.png');

/** Native asset dimensions — used only to preserve aspect ratio at render time. */
const HEADER_LOGO_ASPECT_RATIO = 1536 / 1024;
export const HEADER_LOGO_HEIGHT = 26;

type LocalLoopHeaderLogoProps = {
  style?: StyleProp<ViewStyle>;
};

/**
 * Small top-left header branding for main app screens only.
 * Do not use on splash, login, sign up, or large centered logo placements.
 */
export function LocalLoopHeaderLogo({ style }: LocalLoopHeaderLogoProps) {
  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={headerLogo}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="LocalLoop"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
  },
  logo: {
    height: HEADER_LOGO_HEIGHT,
    aspectRatio: HEADER_LOGO_ASPECT_RATIO,
  },
});
