import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnalyticsDevTierPreview } from '@/components/business/analytics/analytics-dev-tier-preview';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useAnalyticsAccess } from '@/hooks/use-analytics-access';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getAnalyticsVisualTone, type AnalyticsVisualTone } from '@/utils/analytics-visual-tones';
import { openAnalyticsUpgrade } from '@/utils/open-analytics-upgrade';

const FUTURE_CAPABILITIES: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: AnalyticsVisualTone;
}[] = [
  {
    title: 'Advanced Analytics',
    description: 'Impressions, CTR, and deeper trends',
    icon: 'bar-chart-outline',
    tone: 'emerald',
  },
  {
    title: 'Potential Reach',
    description: 'Understand relevant local demand you could reach',
    icon: 'radio-outline',
    tone: 'coral',
  },
  {
    title: 'Content Opportunities',
    description: 'Discover underserved content opportunities nearby',
    icon: 'bulb-outline',
    tone: 'amber',
  },
  {
    title: 'Local Benchmarking',
    description: 'See your performance in local context',
    icon: 'git-compare-outline',
    tone: 'teal',
  },
];

export function AnalyticsMorePanel() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const { tier, hasCapability } = useAnalyticsAccess();
  const isPremium = hasCapability('analytics.competitive_intelligence');

  const planName = tier === 'premium' ? 'Premium' : tier === 'pro' ? 'Pro' : 'Basic';
  const planCopy = isPremium
    ? 'Premium Analytics and Competitive Intelligence are enabled for this preview.'
    : tier === 'pro'
      ? 'Pro gives you deeper performance, content, and audience analytics to help you understand and improve your LocalLoop presence.'
      : 'You are on Basic Analytics. Compare Pro and Premium when you are ready for deeper intelligence.';

  return (
    <View style={styles.root}>
      <View style={styles.planCard}>
        <Text style={styles.planEyebrow}>Current plan</Text>
        <Text style={styles.planName}>{planName}</Text>
        <Text style={styles.planCopy}>{planCopy}</Text>
        {!isPremium ? (
          <Pressable
            onPress={() => openAnalyticsUpgrade('analytics-more-explore-plans')}
            style={({ pressed }) => [styles.planButton, pressed && styles.planButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Explore plans">
            <Text style={styles.planButtonText}>Explore plans</Text>
            <Ionicons name="arrow-forward" size={16} color={styles.planButtonText.color} />
          </Pressable>
        ) : null}
      </View>

      {isPremium ? (
        <Text style={styles.sectionTitle}>Analytics settings</Text>
      ) : (
        <Text style={styles.sectionTitle}>Coming to paid plans</Text>
      )}
      {isPremium ? (
        <Text style={styles.premiumUtilityCopy}>
          Plan management, exports, and reporting tools will live here. Competitive Intelligence is
          your primary destination for strategy.
        </Text>
      ) : null}
      {!isPremium ? (
        <View style={styles.capabilityList}>
          {FUTURE_CAPABILITIES.map((item) => {
            const tone = getAnalyticsVisualTone(theme, item.tone);
            return (
              <View key={item.title} style={styles.capabilityRow}>
                <View style={[styles.capabilityIcon, { backgroundColor: tone.background }]}>
                  <Ionicons name={item.icon} size={18} color={tone.foreground} />
                </View>
                <View style={styles.capabilityCopy}>
                  <Text style={styles.capabilityTitle}>{item.title}</Text>
                  <Text style={styles.capabilityDescription}>{item.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      <AnalyticsDevTierPreview />
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    root: {
      gap: 16,
    },
    planCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      borderTopWidth: 3,
      borderTopColor: theme.emerald,
      padding: 18,
      gap: 8,
      ...theme.shadowCard,
    },
    planEyebrow: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    planName: {
      color: theme.text,
      fontSize: 28,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.5,
    },
    planCopy: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    planButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      marginTop: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: BrandRadius.pill,
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
    },
    planButtonPressed: {
      opacity: 0.9,
    },
    planButtonText: {
      color: theme.emerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      marginTop: 4,
    },
    premiumUtilityCopy: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    capabilityList: {
      gap: 4,
    },
    capabilityRow: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    capabilityIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    capabilityCopy: {
      flex: 1,
      gap: 2,
      justifyContent: 'center',
    },
    capabilityTitle: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    capabilityDescription: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
  });
}
