import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AnnouncementDraft } from '@/types/announcement-draft';
import { formatDisplayDate, getAnnouncementCategoryLabel } from '@/utils/announcement-form';

type AnnouncementPreviewCardProps = {
  draft: AnnouncementDraft;
  businessName: string;
  verified?: boolean;
};

export function AnnouncementPreviewCard({
  draft,
  businessName,
  verified = true,
}: AnnouncementPreviewCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const categoryLabel = getAnnouncementCategoryLabel(draft.category);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="storefront" size={20} color={theme.emerald} />
        </View>
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.businessName}>{businessName}</Text>
            {verified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={theme.emerald} />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
            </View>
            {draft.isPinned ? (
              <View style={styles.pinBadge}>
                <Ionicons name="pin" size={12} color={theme.coral} />
                <Text style={styles.pinBadgeText}>Pinned</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {draft.imageUri ? (
        <View style={styles.imageWrap}>
          <Image source={{ uri: draft.imageUri }} style={styles.image} contentFit="cover" />
        </View>
      ) : null}

      <View style={styles.body}>
        <Text style={styles.title}>{draft.title}</Text>
        <Text style={styles.message}>{draft.message}</Text>

        {draft.hasExpiration && draft.startDate && draft.endDate ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Active dates</Text>
            <Text style={styles.detailText}>
              {formatDisplayDate(draft.startDate)} – {formatDisplayDate(draft.endDate)}
            </Text>
          </View>
        ) : null}

        {draft.notifyFollowers ? (
          <View style={styles.notifyBadge}>
            <Ionicons name="notifications-outline" size={14} color={theme.emerald} />
            <Text style={styles.notifyBadgeText}>Followers will be notified</Text>
          </View>
        ) : null}
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
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
      gap: 8,
    },
    nameRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
    },
    businessName: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.emeraldGlow,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: theme.emerald,
    },
    verifiedBadgeText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.semiBold,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryBadge: {
      backgroundColor: theme.coralGlow,
      borderWidth: 1,
      borderColor: theme.coral,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    categoryBadgeText: {
      color: theme.coral,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    pinBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    pinBadgeText: {
      color: theme.coral,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    imageWrap: {
      marginHorizontal: 16,
      borderRadius: BrandRadius.md,
      overflow: 'hidden',
      backgroundColor: theme.surfaceElevated,
    },
    image: {
      width: '100%',
      height: 200,
    },
    body: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 18,
      gap: 12,
    },
    title: {
      color: theme.text,
      fontSize: 20,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
      lineHeight: 26,
    },
    message: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
    detailBlock: {
      gap: 4,
    },
    metaLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    detailText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    notifyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    notifyBadgeText: {
      color: theme.emerald,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
