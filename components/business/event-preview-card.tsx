import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { EventDraft, EventStatusLabel } from '@/types/event-draft';
import {
  formatDisplayDate,
  formatDisplayTime,
  formatEventPrice,
  getAgeRequirementLabel,
  getEventLocationLabel,
  getEventStatus,
  getTicketBadgeLabel,
} from '@/utils/event-form';

type EventPreviewCardProps = {
  draft: EventDraft;
  businessName: string;
  businessAddress: string;
  verified?: boolean;
};

function statusStyles(status: EventStatusLabel, theme: AppThemeTokens) {
  switch (status) {
    case 'Happening Today':
      return {
        backgroundColor: theme.emeraldGlow,
        borderColor: theme.emerald,
        textColor: theme.emerald,
      };
    case 'In Progress':
      return {
        backgroundColor: theme.emeraldGlow,
        borderColor: theme.emerald,
        textColor: theme.emerald,
      };
    case 'Ended':
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

function ticketStyles(ticketType: EventDraft['ticketType'], theme: AppThemeTokens) {
  switch (ticketType) {
    case 'paid':
      return {
        backgroundColor: theme.coralGlow,
        borderColor: theme.coral,
        textColor: theme.coral,
      };
    case 'rsvp':
      return {
        backgroundColor: theme.surfaceElevated,
        borderColor: theme.border,
        textColor: theme.text,
      };
    default:
      return {
        backgroundColor: theme.emeraldGlow,
        borderColor: theme.emerald,
        textColor: theme.emerald,
      };
  }
}

export function EventPreviewCard({
  draft,
  businessName,
  businessAddress,
  verified = true,
}: EventPreviewCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const status = getEventStatus(draft);
  const statusBadge = statusStyles(status, theme);
  const ticketBadge = ticketStyles(draft.ticketType, theme);
  const ticketLabel = getTicketBadgeLabel(draft);
  const priceLabel = formatEventPrice(draft.price);
  const ageLabel = getAgeRequirementLabel(draft);
  const locationLabel = getEventLocationLabel(draft, businessAddress);
  const hasContact =
    draft.contactName.trim() || draft.contactPhone.trim() || draft.contactEmail.trim();

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
              styles.statusBadge,
              { backgroundColor: statusBadge.backgroundColor, borderColor: statusBadge.borderColor },
            ]}>
            <Text style={[styles.statusBadgeText, { color: statusBadge.textColor }]}>{status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.imageWrap}>
        {draft.imageUri ? (
          <Image source={{ uri: draft.imageUri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="calendar-outline" size={28} color={theme.textSecondary} />
            <Text style={styles.imagePlaceholderText}>Event cover image preview</Text>
          </View>
        )}
        <View style={styles.eventBadge}>
          <Text style={styles.eventBadgeText}>EVENT</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{draft.eventName}</Text>
        <Text style={styles.description}>{draft.description}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatDisplayDate(draft.eventDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Time</Text>
            <Text style={styles.metaValue}>
              {formatDisplayTime(draft.startTime)}
              {draft.endTime ? ` – ${formatDisplayTime(draft.endTime)}` : ''}
            </Text>
          </View>
        </View>

        {draft.isMultiDay && draft.endDate ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Multi-day event</Text>
            <Text style={styles.detailText}>
              {formatDisplayDate(draft.eventDate)} – {formatDisplayDate(draft.endDate)}
            </Text>
          </View>
        ) : null}

        <View style={styles.detailBlock}>
          <Text style={styles.metaLabel}>Location</Text>
          <Text style={styles.detailText}>{locationLabel}</Text>
        </View>

        <View style={styles.badgeRow}>
          <View
            style={[
              styles.ticketBadge,
              { backgroundColor: ticketBadge.backgroundColor, borderColor: ticketBadge.borderColor },
            ]}>
            <Text style={[styles.ticketBadgeText, { color: ticketBadge.textColor }]}>{ticketLabel}</Text>
          </View>
          {priceLabel ? <Text style={styles.priceText}>{priceLabel}</Text> : null}
        </View>

        {draft.capacity.trim() ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Capacity</Text>
            <Text style={styles.detailText}>{draft.capacity.trim()}</Text>
          </View>
        ) : null}

        {ageLabel ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Age requirement</Text>
            <Text style={styles.detailText}>{ageLabel}</Text>
          </View>
        ) : null}

        {draft.additionalInformation.trim() ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Additional information</Text>
            <Text style={styles.detailText}>{draft.additionalInformation.trim()}</Text>
          </View>
        ) : null}

        {hasContact ? (
          <View style={styles.detailBlock}>
            <Text style={styles.metaLabel}>Contact</Text>
            {draft.contactName.trim() ? (
              <Text style={styles.detailText}>{draft.contactName.trim()}</Text>
            ) : null}
            {draft.contactPhone.trim() ? (
              <Text style={styles.detailText}>{draft.contactPhone.trim()}</Text>
            ) : null}
            {draft.contactEmail.trim() ? (
              <Text style={styles.detailText}>{draft.contactEmail.trim()}</Text>
            ) : null}
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
    eventBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      backgroundColor: theme.coral,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    eventBadgeText: {
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
    metaRow: {
      flexDirection: 'row',
      gap: 12,
    },
    metaItem: {
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
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 10,
    },
    ticketBadge: {
      borderWidth: 1,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    ticketBadgeText: {
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    priceText: {
      color: theme.coral,
      fontSize: 18,
      fontFamily: BrandFonts.bold,
    },
  });
}
