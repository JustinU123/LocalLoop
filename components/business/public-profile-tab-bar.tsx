import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  PUBLIC_PROFILE_TABS,
  type PublicProfileTab,
} from '@/types/public-profile-tab';

type PublicProfileTabBarProps = {
  activeTab: PublicProfileTab;
  onTabChange: (tab: PublicProfileTab) => void;
};

export function PublicProfileTabBar({ activeTab, onTabChange }: PublicProfileTabBarProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsRow}
      style={styles.tabsScroll}>
      {PUBLIC_PROFILE_TABS.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={[styles.tabChip, selected && styles.tabChipActive]}>
            <Text style={[styles.tabChipText, selected && styles.tabChipTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    tabsScroll: {
      marginHorizontal: -16,
    },
    tabsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingTop: 14,
      paddingBottom: 12,
      paddingHorizontal: 16,
    },
    tabChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    tabChipActive: {
      backgroundColor: theme.emeraldGlow,
      borderColor: theme.emerald,
    },
    tabChipText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    tabChipTextActive: {
      color: theme.emerald,
    },
  });
}
