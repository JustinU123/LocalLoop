import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { LocalLoopWordmark } from '@/components/onboarding/local-loop-wordmark';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AppThemeTokens } from '@/constants/business-theme';

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
      <Animated.View entering={FadeInUp.duration(400)}>
        <LocalLoopWordmark size="large" />
      </Animated.View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  });
}
