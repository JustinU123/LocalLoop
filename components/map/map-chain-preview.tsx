import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { getAppleMapsDirectionsUrl } from '@/data/businesses';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { MapChainPinWithDistance } from '@/types/map-pin';
import { getBusinessInitials } from '@/utils/business-initials';
import { MAP_CHAIN_MARKER_COLOR } from '@/utils/map-marker-colors';

type MapChainPreviewProps = {
  pin: MapChainPinWithDistance;
  onClose: () => void;
};

function formatChainAddress(pin: MapChainPinWithDistance): string | null {
  const formatted = pin.formattedAddress?.trim();
  if (formatted) {
    return formatted;
  }

  const parts = [pin.streetAddress, pin.city, pin.state, pin.postalCode]
    .map((part) => part?.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : null;
}

export function MapChainPreview({ pin, onClose }: MapChainPreviewProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const address = formatChainAddress(pin);

  return (
    <View style={styles.card}>
      <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
        <Ionicons name="close" size={18} color={theme.textSecondary} />
      </Pressable>

      <View style={styles.headerRow}>
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarFallbackText}>{getBusinessInitials(pin.name)}</Text>
        </View>

        <View style={styles.headerMain}>
          <Text style={styles.name} numberOfLines={2}>
            {pin.name}
          </Text>
          <View style={styles.chainBadge}>
            <Text style={styles.chainBadgeText}>National chain</Text>
          </View>
          <Text style={styles.category} numberOfLines={1}>
            {pin.category}
          </Text>
          {pin.distanceLabel ? (
            <Text style={styles.distance} numberOfLines={1}>
              {pin.distanceLabel}
            </Text>
          ) : null}
        </View>
      </View>

      {address ? (
        <Text style={styles.address} numberOfLines={3}>
          {address}
        </Text>
      ) : null}

      <Pressable
        onPress={() => Linking.openURL(getAppleMapsDirectionsUrl(pin.latitude, pin.longitude))}
        style={({ pressed }) => [styles.directionsButton, pressed && styles.buttonPressed]}>
        <Ionicons name="navigate-outline" size={18} color={theme.text} />
        <Text style={styles.directionsButtonText}>Directions</Text>
      </Pressable>

      <Text style={styles.attribution}>Powered by Foursquare</Text>
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
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 14,
      zIndex: 20,
      elevation: 20,
      ...theme.shadowCard,
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      zIndex: 1,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      paddingRight: 28,
    },
    avatarFallback: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: `${MAP_CHAIN_MARKER_COLOR}22`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarFallbackText: {
      color: MAP_CHAIN_MARKER_COLOR,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
    },
    headerMain: {
      flex: 1,
      minWidth: 0,
      gap: 6,
    },
    name: {
      color: theme.text,
      fontSize: 19,
      lineHeight: 24,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    chainBadge: {
      alignSelf: 'flex-start',
      backgroundColor: `${MAP_CHAIN_MARKER_COLOR}22`,
      borderWidth: 1,
      borderColor: MAP_CHAIN_MARKER_COLOR,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    chainBadgeText: {
      color: MAP_CHAIN_MARKER_COLOR,
      fontSize: 11,
      fontFamily: BrandFonts.semiBold,
    },
    category: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.medium,
    },
    distance: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.semiBold,
    },
    address: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: BrandFonts.regular,
      marginTop: 12,
    },
    directionsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 48,
      marginTop: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    directionsButtonText: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    attribution: {
      marginTop: 12,
      textAlign: 'center',
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: BrandFonts.medium,
    },
    buttonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
  });
}
