import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityRow, BusinessSectionCard } from '@/components/business/business-section-card';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import {
  BUSINESS_ACTIVITY_GROUP_LABELS,
  PLACEHOLDER_BUSINESS_ACTIVITY,
} from '@/data/business-activity';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export default function BusinessActivityScreen() {
  const styles = useThemedStyles(createStyles);

  const groups = ['today', 'earlier'] as const;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>
          Business engagement updates for your profile, posts, and promotions.
        </Text>
        <Text style={styles.demoNote}>Placeholder activity data for development preview.</Text>

        {groups.map((group) => {
          const items = PLACEHOLDER_BUSINESS_ACTIVITY.filter((item) => item.group === group);
          return (
            <BusinessSectionCard key={group} title={BUSINESS_ACTIVITY_GROUP_LABELS[group]}>
              {items.map((item, index) => (
                <View key={item.id}>
                  <ActivityRow message={item.message} unread={item.unread} />
                  {index < items.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </BusinessSectionCard>
          );
        })}
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
      gap: 16,
    },
    title: {
      color: theme.text,
      fontSize: 34,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.8,
      marginTop: 4,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
    demoNote: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 32,
    },
  });
}
