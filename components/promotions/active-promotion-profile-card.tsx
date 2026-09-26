import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import type { BusinessPromotionItem } from '@/data/businesses';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type ActivePromotionProfileCardProps = {
  promotion: BusinessPromotionItem;
  /** Owner-only scheduled status pill (e.g. "Live in 4 min"). */
  scheduledLiveLabel?: string | null;
  onOwnerEdit?: () => void;
};

export function ActivePromotionProfileCard({
  promotion,
  scheduledLiveLabel,
  onOwnerEdit,
}: ActivePromotionProfileCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const imageUri = promotion.image?.trim();
  const isOwnerScheduledPreview = Boolean(scheduledLiveLabel?.trim());

  return (
    <View style={[styles.card, isOwnerScheduledPreview ? styles.cardScheduledPreview : null]}>
      {imageUri ? (
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" transition={200} />
          <View style={styles.promotionBadge}>
            <Text style={styles.promotionBadgeText}>PROMOTION</Text>
          </View>
          {isOwnerScheduledPreview ? (
            <View style={styles.scheduledPill}>
              <Text style={styles.scheduledPillText}>{scheduledLiveLabel}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {!imageUri && isOwnerScheduledPreview ? (
        <View style={styles.scheduledPillStandalone}>
          <Text style={styles.scheduledPillText}>{scheduledLiveLabel}</Text>
        </View>
      ) : null}

      <View style={styles.body}>
        <Text style={styles.title}>{promotion.title}</Text>
        <Text style={styles.description}>{promotion.description}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
          <Text style={styles.metaText}>{promotion.scheduleLabel}</Text>
        </View>
        <Text style={styles.expiresText}>{promotion.expiresLabel}</Text>

        {promotion.promotionCode ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Promotion code</Text>
            <Text style={styles.codeValue}>{promotion.promotionCode}</Text>
          </View>
        ) : null}

        {promotion.redemptionInstructions ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Redemption instructions</Text>
            <Text style={styles.detailText}>{promotion.redemptionInstructions}</Text>
          </View>
        ) : null}

        {promotion.termsAndConditions ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Terms and conditions</Text>
            <Text style={styles.detailText}>{promotion.termsAndConditions}</Text>
          </View>
        ) : null}

        {onOwnerEdit ? (
          <Pressable
            onPress={onOwnerEdit}
            style={({ pressed }) => [styles.editButton, pressed ? styles.editButtonPressed : null]}
            accessibilityRole="button"
            accessibilityLabel="Edit promotion">
            <Ionicons name="create-outline" size={18} color={theme.emerald} />
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
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
    cardScheduledPreview: {
      borderColor: theme.star,
    },
    imageWrap: {
      position: 'relative',
      backgroundColor: theme.surfaceElevated,
    },
    image: {
      width: '100%',
      height: 200,
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
    scheduledPill: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: theme.star,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 12,
      paddingVertical: 6,
      maxWidth: '62%',
    },
    scheduledPillStandalone: {
      alignSelf: 'flex-start',
      marginTop: 12,
      marginHorizontal: 16,
      backgroundColor: theme.star,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    scheduledPillText: {
      color: '#1A1A1A',
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    body: {
      padding: 16,
      gap: 8,
    },
    title: {
      color: theme.text,
      fontSize: 20,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    description: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    metaText: {
      flex: 1,
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
    },
    expiresText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
    detailBlock: {
      marginTop: 8,
      gap: 4,
    },
    metaLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    codeValue: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
      letterSpacing: 1,
    },
    detailText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 12,
      paddingVertical: 12,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSecondary,
    },
    editButtonPressed: {
      opacity: 0.85,
    },
    editButtonText: {
      color: theme.emerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
