import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RadiusSelector } from '@/components/promotions/radius-selector';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useLocationSettings } from '@/contexts/location-settings-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

function SectionLabel({ label, styles }: { label: string; styles: ReturnType<typeof createStyles> }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

export default function LocationScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const {
    permissionGranted,
    cityLabel,
    searchRadius,
    isRefreshing,
    setSearchRadius,
    refreshLocation,
    openSystemSettings,
  } = useLocationSettings();

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refreshLocation();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Location</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SectionLabel label="Current Location" styles={styles} />
        <View style={styles.groupCard}>
          {permissionGranted && cityLabel ? (
            <View style={styles.locationCard}>
              <View style={styles.locationIconWrap}>
                <Ionicons name="location" size={22} color={theme.emerald} />
              </View>
              <View style={styles.locationText}>
                <Text style={styles.locationTitle}>{cityLabel}</Text>
                <Text style={styles.locationSubtitle}>Detected from your current location</Text>
              </View>
            </View>
          ) : (
            <View style={styles.deniedCard}>
              <View style={styles.deniedIconWrap}>
                <Ionicons name="location-outline" size={22} color={theme.coral} />
              </View>
              <Text style={styles.deniedTitle}>Location access is disabled.</Text>
              <Text style={styles.deniedText}>
                Enable location in Settings to discover nearby businesses.
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openSystemSettings();
                }}
                style={({ pressed }) => [styles.openSettingsButton, pressed && styles.buttonPressed]}>
                <Text style={styles.openSettingsText}>Open Settings</Text>
              </Pressable>
            </View>
          )}
        </View>

        <SectionLabel label="Location Access" styles={styles} />
        <View style={styles.groupCard}>
          <View style={styles.accessRow}>
            <View style={styles.accessIconWrap}>
              <Ionicons
                name={permissionGranted ? 'shield-checkmark-outline' : 'close-circle-outline'}
                size={18}
                color={permissionGranted ? theme.emerald : theme.coral}
              />
            </View>
            <Text style={styles.accessLabel}>Permission</Text>
            <Text style={[styles.accessValue, permissionGranted && styles.accessValueActive]}>
              {permissionGranted ? 'While Using App' : 'Disabled'}
            </Text>
          </View>
        </View>

        <SectionLabel label="Search Radius" styles={styles} />
        <Text style={styles.sectionHint}>
          Nearby results across LocalLoop use this distance from your location.
        </Text>
        <RadiusSelector selectedRadius={searchRadius} onSelect={setSearchRadius} />

        <Pressable
          onPress={handleRefresh}
          disabled={isRefreshing}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.buttonPressed,
            isRefreshing && styles.refreshButtonDisabled,
          ]}>
          {isRefreshing ? (
            <ActivityIndicator color={theme.emerald} />
          ) : (
            <Ionicons name="refresh" size={18} color={theme.emerald} />
          )}
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? 'Refreshing…' : 'Refresh Location'}
          </Text>
        </Pressable>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
      paddingTop: 4,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 10,
    },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 8,
    },
    sectionHint: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
      marginBottom: 4,
    },
    groupCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    locationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 16,
    },
    locationIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationText: {
      flex: 1,
      gap: 4,
    },
    locationTitle: {
      color: theme.text,
      fontSize: 22,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.4,
    },
    locationSubtitle: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.regular,
    },
    deniedCard: {
      padding: 20,
      alignItems: 'center',
      gap: 10,
    },
    deniedIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.coralGlow,
      borderWidth: 1,
      borderColor: theme.coral,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    deniedTitle: {
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.bold,
      textAlign: 'center',
    },
    deniedText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
    openSettingsButton: {
      marginTop: 8,
      backgroundColor: theme.emerald,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 18,
      paddingVertical: 12,
      ...theme.shadowButton,
    },
    openSettingsText: {
      color: theme.onEmerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    accessRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    accessIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accessLabel: {
      flex: 1,
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.medium,
    },
    accessValue: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    accessValueActive: {
      color: theme.emerald,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 16,
      backgroundColor: theme.emeraldGlow,
      borderWidth: 1,
      borderColor: theme.emerald,
      borderRadius: BrandRadius.md,
      paddingVertical: 14,
    },
    refreshButtonDisabled: {
      opacity: 0.7,
    },
    refreshButtonText: {
      color: theme.emerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    buttonPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
  });
}
