import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'Included',
    highlight: false,
    features: ['Core analytics overview', 'Content list', 'Follower count'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19.99/month',
    highlight: true,
    features: ['Expanded performance metrics', 'Content insights', 'Trend comparisons'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$29.99/month',
    highlight: false,
    features: ['Advanced insights', 'Audience intelligence', 'Local benchmarking'],
  },
] as const;

export default function BusinessPlansScreen() {
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title="Plans" onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Compare plans for LocalLoop Business. Subscriptions and checkout are not enabled in this
          build — this screen is a placeholder for the upcoming upgrade flow.
        </Text>

        {PLANS.map((plan) => (
          <View
            key={plan.id}
            style={[styles.planCard, plan.highlight && styles.planCardHighlight]}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>
            {plan.features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={styles.check.color} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        ))}

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Text style={styles.backButtonText}>Back to Analytics</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
      gap: 14,
    },
    intro: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      marginBottom: 6,
    },
    planCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 10,
      ...theme.shadowCard,
    },
    planCardHighlight: {
      borderColor: theme.emerald,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12,
    },
    planName: {
      color: theme.text,
      fontSize: 20,
      fontFamily: BrandFonts.bold,
    },
    planPrice: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    check: {
      color: theme.emerald,
    },
    featureText: {
      flex: 1,
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.regular,
    },
    backButton: {
      marginTop: 8,
      alignItems: 'center',
      paddingVertical: 14,
    },
    backButtonPressed: {
      opacity: 0.85,
    },
    backButtonText: {
      color: theme.emerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
