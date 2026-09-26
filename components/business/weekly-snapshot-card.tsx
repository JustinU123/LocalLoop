import { StyleSheet, Text, View } from 'react-native';

import { MetricCard } from '@/components/business/metric-card';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { WeeklySnapshotViewModel } from '@/types/analytics-weekly-snapshot';
import { formatWeeklySnapshotMetricDisplay } from '@/utils/build-weekly-snapshot';

type WeeklySnapshotCardProps = {
  snapshot: WeeklySnapshotViewModel;
};

export function WeeklySnapshotCard({ snapshot }: WeeklySnapshotCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Snapshot</Text>
        <Text style={styles.subtitle}>Last 7 days</Text>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.tile}>
          <MetricCard
            compact
            icon="create-outline"
            iconTone="emerald"
            label="Posts"
            value={formatWeeklySnapshotMetricDisplay(snapshot.posts)}
          />
        </View>
        <View style={styles.tile}>
          <MetricCard
            compact
            icon="heart-outline"
            iconTone="coral"
            label="Likes"
            value={formatWeeklySnapshotMetricDisplay(snapshot.likes)}
          />
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.tile}>
          <MetricCard
            compact
            icon="chatbubble-outline"
            iconTone="blue"
            label="Comments"
            value={formatWeeklySnapshotMetricDisplay(snapshot.comments)}
          />
        </View>
        <View style={styles.tile}>
          <MetricCard
            compact
            icon="person-add-outline"
            iconTone="emerald"
            label="New followers"
            value={formatWeeklySnapshotMetricDisplay(snapshot.newFollowers)}
          />
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      gap: 10,
      ...theme.shadowCard,
    },
    header: {
      gap: 2,
      paddingHorizontal: 2,
    },
    title: {
      color: theme.text,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.regular,
    },
    gridRow: {
      flexDirection: 'row',
      gap: 10,
    },
    tile: {
      flex: 1,
      minWidth: 0,
    },
  });
}
