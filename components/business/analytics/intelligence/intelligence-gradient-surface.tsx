import { StyleSheet, View, type ViewStyle } from 'react-native';

import { BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getIntelligenceTheme } from '@/utils/analytics-intelligence-theme';

type IntelligenceGradientSurfaceProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
};

/** Layered rgba bands — no extra gradient dependency. */
export function IntelligenceGradientSurface({
  children,
  style,
  padded = true,
}: IntelligenceGradientSurfaceProps) {
  const { theme } = useAppTheme();
  const intelligence = getIntelligenceTheme(theme);
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[
        styles.root,
        {
          borderColor: intelligence.border,
          backgroundColor: intelligence.background,
        },
        style,
      ]}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: intelligence.gradientTop, opacity: 0.85 }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.bottomWash,
          { backgroundColor: intelligence.gradientBottom },
        ]}
      />
      <View style={padded ? styles.content : undefined}>{children}</View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    bottomWash: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '45%',
    },
    content: {
      padding: 16,
      gap: 12,
    },
  });
}
