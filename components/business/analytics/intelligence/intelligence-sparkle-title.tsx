import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

import { BrandFonts } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { getIntelligenceTheme } from '@/utils/analytics-intelligence-theme';
type IntelligenceSparkleTitleProps = {
  title: string;
  subtitle?: string;
  size?: 'default' | 'large';
  style?: ViewStyle;
  titleStyle?: TextStyle;
};

export function IntelligenceSparkleTitle({
  title,
  subtitle,
  size = 'default',
  style,
  titleStyle,
}: IntelligenceSparkleTitleProps) {
  const { theme } = useAppTheme();
  const intelligence = getIntelligenceTheme(theme);

  return (
    <View style={[styles.root, style]}>
      <View style={styles.titleRow}>
        <Ionicons
          name="sparkles"
          size={size === 'large' ? 18 : 15}
          color={intelligence.foreground}
        />
        <Text
          style={[
            size === 'large' ? styles.titleLarge : styles.title,
            { color: intelligence.foreground },
            titleStyle,
          ]}>
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: intelligence.foregroundMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6,
    alignSelf: 'stretch',
    width: '100%',
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    minWidth: 0,
  },
  title: {
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    fontFamily: BrandFonts.bold,
    letterSpacing: -0.2,
  },
  titleLarge: {
    flex: 1,
    flexShrink: 1,
    fontSize: 22,
    fontFamily: BrandFonts.bold,
    letterSpacing: -0.4,
  },
  subtitle: {
    alignSelf: 'stretch',
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: BrandFonts.regular,
  },
});
