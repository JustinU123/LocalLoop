import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AppThemeTokens } from '@/constants/business-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SPLASH_LOGO_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 360);

const splashLogo = require('@/assets/images/localloop-splash-logo.png');

export default function SplashScreen() {
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding/welcome');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(400)} style={styles.logoWrap}>
        <Image
          source={splashLogo}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="LocalLoop"
        />
      </Animated.View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: SPLASH_LOGO_WIDTH,
      height: SPLASH_LOGO_WIDTH * 1.15,
    },
  });
}
