import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/account/primary-button';
import { QuickActionRow } from '@/components/business/quick-action-row';
import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { PLACEHOLDER_BUSINESS_PROFILE } from '@/constants/business-dashboard';
import { useAccountMode } from '@/contexts/account-mode-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

const PROFILE_TABS = ['Posts', 'Videos', 'Photos', 'Promotions', 'Reviews', 'About'] as const;

export default function BusinessProfileScreen() {
  const styles = useThemedStyles(createStyles);
  const { businessApplication, switchToExplorerMode } = useAccountMode();
  const [activeTab, setActiveTab] = useState<(typeof PROFILE_TABS)[number]>('Posts');
  const profile = PLACEHOLDER_BUSINESS_PROFILE;
  const businessName = businessApplication?.businessName?.trim() || profile.name;
  const businessCategory = businessApplication?.category?.trim() || profile.category;
  const biography = businessApplication?.description?.trim() || profile.biography;

  const handlePlaceholderAction = (label: string) => {
    Alert.alert('Coming soon', `${label} will be connected in a future business tools update.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="storefront" size={34} color={styles.avatarIcon.color} />
          </View>
          <Text style={styles.businessName}>{businessName}</Text>
          <Text style={styles.category}>{businessCategory}</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>Verified</Text>
          </View>
          <Text style={styles.biography}>{biography}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.reviewCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.postCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {PROFILE_TABS.map((tab) => {
            const selected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab);
                }}
                style={[styles.tabChip, selected && styles.tabChipSelected]}>
                <Text style={[styles.tabChipLabel, selected && styles.tabChipLabelSelected]}>{tab}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.tabContent}>
          <Text style={styles.tabContentTitle}>{activeTab}</Text>
          <Text style={styles.tabContentBody}>
            Placeholder {activeTab.toLowerCase()} content for your public business profile preview.
          </Text>
        </View>

        <View style={styles.managementCard}>
          <QuickActionRow
            label="Edit Business Profile"
            icon="create-outline"
            onPress={() => handlePlaceholderAction('Edit Business Profile')}
          />
          <View style={styles.divider} />
          <QuickActionRow
            label="View Public Profile"
            icon="eye-outline"
            onPress={() => handlePlaceholderAction('View Public Profile')}
          />
          <View style={styles.divider} />
          <QuickActionRow
            label="Manage Promotions"
            icon="pricetag-outline"
            onPress={() => handlePlaceholderAction('Manage Promotions')}
          />
          <View style={styles.divider} />
          <QuickActionRow
            label="Business Settings"
            icon="settings-outline"
            onPress={() => handlePlaceholderAction('Business Settings')}
          />
        </View>

        <PrimaryButton
          label="Switch to Local Explorer"
          onPress={() => {
            void switchToExplorerMode();
          }}
        />
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
    profileHeader: {
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      gap: 8,
      ...theme.shadowCard,
    },
    avatarPlaceholder: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.emeraldGlow,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    avatarIcon: {
      color: theme.emerald,
    },
    businessName: {
      color: theme.text,
      fontSize: 24,
      fontFamily: BrandFonts.bold,
      textAlign: 'center',
    },
    category: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: BrandFonts.medium,
    },
    verifiedBadge: {
      backgroundColor: theme.emeraldGlow,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    verifiedBadgeText: {
      color: theme.emerald,
      fontSize: 11,
      fontFamily: BrandFonts.bold,
      textTransform: 'uppercase',
    },
    biography: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
      marginTop: 4,
    },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 14,
      marginTop: 10,
    },
    statItem: {
      alignItems: 'center',
      minWidth: 56,
      gap: 2,
    },
    statValue: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
    },
    statLabel: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: BrandFonts.medium,
    },
    tabs: {
      gap: 8,
      paddingVertical: 2,
    },
    tabChip: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    tabChipSelected: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    tabChipLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    tabChipLabelSelected: {
      color: theme.emerald,
    },
    tabContent: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 6,
      ...theme.shadowCard,
    },
    tabContentTitle: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.semiBold,
    },
    tabContentBody: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
    managementCard: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...theme.shadowCard,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
      marginLeft: 44,
    },
  });
}
