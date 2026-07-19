import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { DIETARY_TAG_OPTIONS } from '@/constants/product-item-create';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { AvailabilityStatus, ProductItemDraft } from '@/types/product-item-draft';
import {
  formatDisplayDate,
  getAvailabilityLabel,
  getItemTypeLabel,
  getPriceDisplayLabel,
  getPurchaseMethodLabel,
  parseVariationValues,
} from '@/utils/product-item-form';

type ProductItemPreviewCardProps = {
  draft: ProductItemDraft;
  businessName: string;
  verified?: boolean;
};

function availabilityStyles(status: AvailabilityStatus, theme: AppThemeTokens) {
  switch (status) {
    case 'available-now':
      return {
        backgroundColor: theme.emeraldGlow,
        borderColor: theme.emerald,
        textColor: theme.emerald,
      };
    case 'coming-soon':
      return {
        backgroundColor: theme.coralGlow,
        borderColor: theme.coral,
        textColor: theme.coral,
      };
    case 'limited-availability':
      return {
        backgroundColor: theme.coralGlow,
        borderColor: theme.coral,
        textColor: theme.coral,
      };
    default:
      return {
        backgroundColor: 'rgba(224, 85, 85, 0.12)',
        borderColor: theme.danger,
        textColor: theme.danger,
      };
  }
}

export function ProductItemPreviewCard({
  draft,
  businessName,
  verified = true,
}: ProductItemPreviewCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const availabilityBadge = availabilityStyles(draft.availabilityStatus, theme);
  const itemTypeLabel = getItemTypeLabel(draft.itemType);
  const priceLabel = getPriceDisplayLabel(draft);
  const dietaryLabels = DIETARY_TAG_OPTIONS.filter((tag) => draft.dietaryTags.includes(tag.id)).map(
    (tag) => tag.label,
  );

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
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: theme.coralGlow, borderColor: theme.coral },
            ]}>
            <Text style={[styles.typeBadgeText, { color: theme.coral }]}>{itemTypeLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.imageWrap}>
        {draft.imageUri ? (
          <Image source={{ uri: draft.imageUri }} style={styles.image} contentFit="cover" />
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{draft.name}</Text>
        <Text style={styles.description}>{draft.description}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{priceLabel}</Text>
          <View
            style={[
              styles.availabilityBadge,
              {
                backgroundColor: availabilityBadge.backgroundColor,
                borderColor: availabilityBadge.borderColor,
              },
            ]}>
            <Text style={[styles.availabilityBadgeText, { color: availabilityBadge.textColor }]}>
              {getAvailabilityLabel(draft.availabilityStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.metaLabel}>Category</Text>
          <Text style={styles.detailText}>{draft.category}</Text>
        </View>

        {draft.availabilityStatus === 'coming-soon' && draft.availableDate ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Available date</Text>
            <Text style={styles.detailText}>{formatDisplayDate(draft.availableDate)}</Text>
          </View>
        ) : null}

        {draft.isLimitedTime && draft.limitedTimeStartDate && draft.limitedTimeEndDate ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Limited-time availability</Text>
            <Text style={styles.detailText}>
              {formatDisplayDate(draft.limitedTimeStartDate)} –{' '}
              {formatDisplayDate(draft.limitedTimeEndDate)}
            </Text>
          </View>
        ) : null}

        {draft.quantityAvailable.trim() ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Quantity available</Text>
            <Text style={styles.detailText}>{draft.quantityAvailable.trim()}</Text>
          </View>
        ) : null}

        {draft.variations.length > 0 ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Options</Text>
            {draft.variations.map((variation) => (
              <Text key={variation.id} style={styles.detailText}>
                {variation.name.trim()}: {parseVariationValues(variation.values).join(', ')}
              </Text>
            ))}
          </View>
        ) : null}

        {draft.itemType === 'menu-item' && dietaryLabels.length > 0 ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Dietary information</Text>
            <View style={styles.tagRow}>
              {dietaryLabels.map((label) => (
                <View key={label} style={styles.tag}>
                  <Text style={styles.tagText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {draft.itemType === 'product' &&
        (draft.brand.trim() || draft.material.trim() || draft.sizeInformation.trim()) ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Product details</Text>
            {draft.brand.trim() ? (
              <Text style={styles.detailText}>Brand: {draft.brand.trim()}</Text>
            ) : null}
            {draft.material.trim() ? (
              <Text style={styles.detailText}>Material: {draft.material.trim()}</Text>
            ) : null}
            {draft.sizeInformation.trim() ? (
              <Text style={styles.detailText}>Size: {draft.sizeInformation.trim()}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.detailBlock}>
          <Text style={styles.metaLabel}>How to get this item</Text>
          <Text style={styles.detailText}>
            {draft.purchaseMethods.map(getPurchaseMethodLabel).join(' · ')}
          </Text>
        </View>

        {draft.productLink.trim() ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Product link</Text>
            <Text style={styles.detailText}>{draft.productLink.trim()}</Text>
          </View>
        ) : null}

        {draft.deliveryNotes.trim() ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Delivery notes</Text>
            <Text style={styles.detailText}>{draft.deliveryNotes.trim()}</Text>
          </View>
        ) : null}

        {draft.additionalInformation.trim() ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Additional information</Text>
            <Text style={styles.detailText}>{draft.additionalInformation.trim()}</Text>
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
    typeBadge: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    typeBadgeText: {
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
      height: 220,
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
    priceRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 10,
    },
    price: {
      color: theme.coral,
      fontSize: 22,
      fontFamily: BrandFonts.bold,
    },
    availabilityBadge: {
      borderWidth: 1,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    availabilityBadgeText: {
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
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
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    tagText: {
      color: theme.text,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
