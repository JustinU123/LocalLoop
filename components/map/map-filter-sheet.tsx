import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import {
  MAP_CATEGORY_OPTIONS,
  MAP_DISTANCE_OPTIONS,
  type MapBusinessCategory,
  type MapDistanceOption,
} from '@/data/map-businesses';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { MapFilters } from '@/utils/map-filters';

type MapFilterSheetProps = {
  visible: boolean;
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  onClose: () => void;
};

function Chip({
  label,
  selected,
  onPress,
  accent = 'emerald',
  showCheckmark = false,
  immutable = false,
  styles,
  theme,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accent?: 'emerald' | 'coral';
  showCheckmark?: boolean;
  immutable?: boolean;
  styles: ReturnType<typeof createStyles>;
  theme: AppThemeTokens;
}) {
  const color = accent === 'coral' ? theme.coral : theme.emerald;
  const chipStyle = [
    styles.chip,
    styles.chipInner,
    selected && { backgroundColor: `${color}22`, borderColor: color },
  ];

  const labelNode = (
    <>
      {showCheckmark && selected ? (
        <Ionicons name="checkmark" size={14} color={color} />
      ) : null}
      <Text style={[styles.chipLabel, selected && { color }]}>{label}</Text>
    </>
  );

  if (immutable) {
    return <View style={chipStyle}>{labelNode}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [...chipStyle, pressed && styles.chipPressed]}>
      {labelNode}
    </Pressable>
  );
}

export function MapFilterSheet({ visible, filters, onChange, onClose }: MapFilterSheetProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const update = (patch: Partial<MapFilters>) => {
    Haptics.selectionAsync();
    onChange({ ...filters, ...patch });
  };

  const toggleIncludeChains = () => {
    update({ includeChains: !filters.includeChains });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Map Filters</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.sectionLabel}>Business Type</Text>
          <View style={styles.businessTypeBlock}>
            <View style={styles.chipRow}>
              <Chip
                label="Local Businesses"
                selected
                showCheckmark
                immutable
                onPress={() => {}}
                styles={styles}
                theme={theme}
              />
            </View>
            <Pressable
              onPress={toggleIncludeChains}
              style={({ pressed }) => [styles.chainCheckboxRow, pressed && styles.chainCheckboxRowPressed]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: filters.includeChains }}>
              <Ionicons
                name={filters.includeChains ? 'checkbox' : 'square-outline'}
                size={20}
                color={filters.includeChains ? theme.emerald : theme.textSecondary}
              />
              <Text style={styles.chainCheckboxLabel}>Include National Food Chains</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Categories</Text>
          <View style={styles.chipRow}>
            {MAP_CATEGORY_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                selected={filters.category === option.id}
                onPress={() => update({ category: option.id as MapBusinessCategory })}
                styles={styles}
                theme={theme}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Distance</Text>
          <View style={styles.chipRow}>
            {MAP_DISTANCE_OPTIONS.map((distance) => (
              <Chip
                key={distance}
                label={`${distance} mi`}
                selected={filters.distanceMiles === distance}
                onPress={() => update({ distanceMiles: distance as MapDistanceOption })}
                styles={styles}
                theme={theme}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>More Filters</Text>
          <View style={styles.toggleList}>
            {[
              { key: 'openNow' as const, label: 'Open Now' },
              { key: 'highestRated' as const, label: 'Highest Rated' },
              { key: 'hasPromotions' as const, label: 'Has Promotions' },
              { key: 'onLocalLoop' as const, label: 'On LocalLoop' },
            ].map((item) => {
              const active = filters[item.key];
              return (
                <Pressable
                  key={item.key}
                  onPress={() => update({ [item.key]: !active })}
                  style={({ pressed }) => [
                    styles.toggleRow,
                    active && styles.toggleRowActive,
                    pressed && styles.toggleRowPressed,
                  ]}>
                  <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>
                    {item.label}
                  </Text>
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={active ? theme.emerald : theme.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: theme.imageScrimMedium,
    },
    sheet: {
      maxHeight: '78%',
      backgroundColor: theme.surface,
      borderTopLeftRadius: BrandRadius.xl,
      borderTopRightRadius: BrandRadius.xl,
      borderWidth: 1,
      borderColor: theme.border,
      ...theme.shadowCard,
    },
    handle: {
      alignSelf: 'center',
      width: 42,
      height: 4,
      borderRadius: 999,
      backgroundColor: theme.border,
      marginTop: 10,
      marginBottom: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    title: {
      color: theme.text,
      fontSize: 20,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.3,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
      gap: 12,
    },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginTop: 8,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      borderRadius: BrandRadius.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    chipPressed: {
      opacity: 0.9,
    },
    chipLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    businessTypeBlock: {
      gap: 8,
    },
    chainCheckboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 2,
    },
    chainCheckboxRowPressed: {
      opacity: 0.92,
    },
    chainCheckboxLabel: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.medium,
    },
    toggleList: {
      gap: 8,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceElevated,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    toggleRowActive: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    toggleRowPressed: {
      opacity: 0.92,
    },
    toggleLabel: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.medium,
    },
    toggleLabelActive: {
      color: theme.emerald,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
