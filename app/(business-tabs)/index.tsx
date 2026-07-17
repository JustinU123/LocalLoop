import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BusinessEmptyState,
  BusinessSectionCard,
} from '@/components/business/business-section-card';
import { MetricCard } from '@/components/business/metric-card';
import { QuickActionRow } from '@/components/business/quick-action-row';
import { LocalLoopWordmark } from '@/components/brand/LocalLoopWordmark';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import {
  BUSINESS_DASHBOARD_METRICS,
  BUSINESS_QUICK_ACTIONS,
  CREATE_OPTION_MESSAGES,
} from '@/constants/business-dashboard';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { getGreetingName } from '@/utils/business-dashboard';
import { getCurrentSession, getDisplayNameFromUser } from '@/utils/auth';

export default function BusinessDashboardScreen() {
  const styles = useThemedStyles(createStyles);
  const { businessApplication } = useAccountMode();
  const [greeting, setGreeting] = useState('Good evening');

  useEffect(() => {
    void getCurrentSession().then((session) => {
      if (session?.user) {
        setGreeting(getGreetingName(getDisplayNameFromUser(session.user)));
      }
    });
  }, []);

  const businessName = businessApplication?.businessName?.trim() || 'Your Business';

  const handleQuickAction = (optionType: string, label: string) => {
    if (optionType === 'announcement' && label === 'View Public Profile') {
      Alert.alert('Public profile coming soon', 'Your public business profile preview will be connected next.');
      return;
    }
    Alert.alert('Coming soon', CREATE_OPTION_MESSAGES[optionType as keyof typeof CREATE_OPTION_MESSAGES] ?? `${label} will be connected next.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <LocalLoopWordmark style={styles.wordmark} />
            <Text style={styles.greeting}>{greeting}</Text>
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>Business Mode</Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings');
            }}
            style={styles.avatarButton}>
            <Ionicons name="person" size={20} color={styles.avatarIcon.color} />
          </Pressable>
        </View>

        <View style={styles.businessCard}>
          <View style={styles.businessCardHeader}>
            <View style={styles.businessIconWrap}>
              <Ionicons name="storefront" size={22} color={styles.businessIcon.color} />
            </View>
            <View style={styles.businessCardText}>
              <Text style={styles.businessName}>{businessName}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            </View>
          </View>
          <Text style={styles.completenessLabel}>Profile completeness</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.completenessValue}>60%</Text>
          <Text style={styles.demoNote}>Demo metrics shown until analytics are connected.</Text>
        </View>

        <View style={styles.metricsGrid}>
          {BUSINESS_DASHBOARD_METRICS.map((metric) => (
            <MetricCard key={metric.id} label={metric.label} value={metric.value} />
          ))}
        </View>

        <BusinessSectionCard title="Quick Actions">
          {BUSINESS_QUICK_ACTIONS.map((action, index) => (
            <View key={action.id}>
              <QuickActionRow
                label={action.label}
                icon={action.icon}
                onPress={() => handleQuickAction(action.optionType, action.label)}
              />
              {index < BUSINESS_QUICK_ACTIONS.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </BusinessSectionCard>

        <BusinessSectionCard title="Recent Activity">
          <BusinessEmptyState message="Your business activity will appear here." />
        </BusinessSectionCard>

        <BusinessSectionCard title="Performance">
          <BusinessEmptyState message="Insights will appear after your posts and promotions receive engagement." />
        </BusinessSectionCard>
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
      paddingHorizontal: 20,
      paddingBottom: 120,
      gap: 18,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    headerCopy: {
      flex: 1,
      gap: 6,
    },
    wordmark: {
      marginBottom: 2,
    },
    greeting: {
      color: theme.text,
      fontSize: 28,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.6,
    },
    modeBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    modeBadgeText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    avatarButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarIcon: {
      color: theme.textSecondary,
    },
    businessCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 10,
      ...theme.shadowCard,
    },
    businessCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    businessIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    businessIcon: {
      color: theme.emerald,
    },
    businessCardText: {
      flex: 1,
      gap: 6,
    },
    businessName: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
    },
    verifiedBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.emeraldGlow,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    verifiedBadgeText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      textTransform: 'uppercase',
    },
    completenessLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
      marginTop: 4,
    },
    progressTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: theme.surfaceElevated,
      overflow: 'hidden',
    },
    progressFill: {
      width: '60%',
      height: '100%',
      backgroundColor: theme.emerald,
      borderRadius: 999,
    },
    completenessValue: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    demoNote: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.regular,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 44,
    },
  });
}
