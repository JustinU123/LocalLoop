import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatProfileCount, formatProfileRatingDisplay } from '@/utils/public-profile-stats';

type PublicProfileStatsRowProps = {
  rating: number;
  postCount: number;
  followerCount: number;
  onRatingPress: () => void;
};

export function PublicProfileStatsRow({
  rating,
  postCount,
  followerCount,
  onRatingPress,
}: PublicProfileStatsRowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onRatingPress}
        style={({ pressed }) => [styles.statBlock, pressed && styles.statPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Rating ${formatProfileRatingDisplay(rating)}, open reviews`}>
        <Text style={styles.statValue}>{formatProfileRatingDisplay(rating)}</Text>
        <Text style={styles.statLabel}>stars</Text>
      </Pressable>

      <View style={styles.divider} />

      <View style={styles.statBlock}>
        <Text style={styles.statValuePlain}>{formatProfileCount(postCount)}</Text>
        <Text style={styles.statLabel}>{postCount === 1 ? 'Post' : 'Posts'}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statBlock}>
        <Text style={styles.statValuePlain}>{formatProfileCount(followerCount)}</Text>
        <Text style={styles.statLabel}>{followerCount === 1 ? 'Follower' : 'Followers'}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginTop: 14,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    statBlock: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 0,
      paddingHorizontal: 4,
    },
    statPressed: {
      opacity: 0.85,
    },
    statValue: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
      textDecorationLine: 'underline',
      textAlign: 'center',
    },
    statValuePlain: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.2,
      textAlign: 'center',
    },
    statLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
      marginTop: 2,
      textAlign: 'center',
    },
    divider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginVertical: 4,
    },
  });
}
