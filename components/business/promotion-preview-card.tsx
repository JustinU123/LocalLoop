import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import type { PromotionDraft, PromotionStatusLabel } from '@/types/promotion-draft';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatPromotionDate, getPromotionStatus } from '@/utils/promotion-form';

type PromotionPreviewCardProps = {
  draft: PromotionDraft;
  businessName: string;
  verified?: boolean;
};

function statusStyles(status: PromotionStatusLabel, theme: AppThemeTokens) {
  switch (status) {
    case 'Active':
      return {
        backgroundColor: theme.emeraldGlow,
        borderColor: theme.emerald,
        textColor: theme.emerald,
      };
    case 'Expired':
      return {
        backgroundColor: 'rgba(224, 85, 85, 0.12)',
        borderColor: theme.danger,
        textColor: theme.danger,
      };
    default:
      return {
        backgroundColor: theme.coralGlow,
        borderColor: theme.coral,
        textColor: theme.coral,
      };
  }
}

export function PromotionPreviewCard({
  draft,
  businessName,
  verified = true,
}: PromotionPreviewCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const status = getPromotionStatus(draft.startDate, draft.endDate);
  const badge = statusStyles(status, theme);

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
          <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor, borderColor: badge.borderColor }]}>
            <Text style={[styles.statusBadgeText, { color: badge.textColor }]}>{status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.imageWrap}>
        {draft.imageUri ? (
          <Image source={{ uri: draft.imageUri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={28} color={theme.textSecondary} />
            <Text style={styles.imagePlaceholderText}>Promotion image preview</Text>
          </View>
        )}
        <View style={styles.promotionBadge}>
          <Text style={styles.promotionBadgeText}>PROMOTION</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{draft.title}</Text>
        <Text style={styles.description}>{draft.description}</Text>

        {draft.promotionCode.trim() ? (
          <View style={styles.codeRow}>
            <Text style={styles.metaLabel}>Promotion code</Text>
            <Text style={styles.codeValue}>{draft.promotionCode.trim()}</Text>
          </View>
        ) : null}

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.metaLabel}>Starts</Text>
            <Text style={styles.metaValue}>{formatPromotionDate(draft.startDate)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.metaLabel}>Ends</Text>
            <Text style={styles.metaValue}>{formatPromotionDate(draft.endDate)}</Text>
          </View>
        </View>

        {draft.redemptionInstructions.trim() ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Redemption instructions</Text>
            <Text style={styles.detailText}>{draft.redemptionInstructions.trim()}</Text>
          </View>
        ) : null}

        {draft.termsAndConditions.trim() ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Terms and conditions</Text>
            <Text style={styles.detailText}>{draft.termsAndConditions.trim()}</Text>
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
    statusBadge: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusBadgeText: {
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    imageWrap: {
      position: 'relative',
      marginHorizontal: 16,
      borderRadius: BrandRadius.md,
      overflow: 'hidden',
      backgroundColor: theme.surfaceElevated,
    },
    image: {
      width: '100%',
      height: 200,
    },
    imagePlaceholder: {
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    imagePlaceholderText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
    },
    promotionBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      backgroundColor: theme.coral,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    promotionBadgeText: {
      color: theme.onCoral,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.6,
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
    description: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
    codeRow: {
      gap: 4,
    },
    codeValue: {
      color: theme.coral,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
      letterSpacing: 1,
    },
    dateRow: {
      flexDirection: 'row',
      gap: 12,
    },
    dateItem: {
      flex: 1,
      gap: 4,
    },
    metaLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    metaValue: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.medium,
    },
    detailBlock: {
      gap: 4,
    },
    detailText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
  });
}
