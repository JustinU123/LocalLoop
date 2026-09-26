import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export function ProfileCompletionCelebration() {
  const styles = useThemedStyles(createStyles);

  return (
    <Animated.View entering={FadeIn.duration(280)} style={styles.root}>
      <Animated.View
        entering={ZoomIn.duration(420).springify().damping(16)}
        style={styles.iconWrap}
        accessibilityRole="image"
        accessibilityLabel="Profile complete">
        <Ionicons name="checkmark" size={28} color={styles.icon.color} />
      </Animated.View>
      <Text style={styles.title}>Profile complete!</Text>
      <Text style={styles.subtitle}>Your business is ready to stand out on LocalLoop.</Text>
    </Animated.View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      alignItems: 'center',
      gap: 8,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: BrandRadius.pill,
      backgroundColor: theme.emeraldGlow,
      borderWidth: 2,
      borderColor: theme.emerald,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      color: theme.emerald,
    },
    title: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
      textAlign: 'center',
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
      paddingHorizontal: 8,
    },
  });
}
