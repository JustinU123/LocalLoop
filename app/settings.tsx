import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StyleSheet, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalLoopWordmark } from '@/components/brand/LocalLoopWordmark';
import { BrandFonts, type AppThemeTokens, type ThemePreference } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';

const APPEARANCE_OPTIONS: {
  id: ThemePreference;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Bright surfaces with soft shadows',
    icon: 'sunny-outline',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Immersive dark surfaces with depth',
    icon: 'moon-outline',
  },
  {
    id: 'system',
    label: 'System',
    description: 'Match your device appearance',
    icon: 'phone-portrait-outline',
  },
];

function AppearanceOption({
  option,
  selected,
  onSelect,
  styles,
  theme,
}: {
  option: (typeof APPEARANCE_OPTIONS)[number];
  selected: boolean;
  onSelect: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: AppThemeTokens;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.optionCard,
        selected && styles.optionCardSelected,
        pressed && styles.optionCardPressed,
      ]}>
      <View style={[styles.optionIconWrap, selected && styles.optionIconWrapSelected]}>
        <Ionicons name={option.icon} size={22} color={selected ? theme.emerald : theme.textSecondary} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{option.label}</Text>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={theme.emerald} />
      ) : (
        <View style={styles.optionRadio} />
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { theme, preference, setPreference } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const handleSelect = async (next: ThemePreference) => {
    if (next === preference) return;
    Haptics.selectionAsync();
    await setPreference(next);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <LocalLoopWordmark style={styles.headerWordmark} />
        <Text style={styles.sectionEyebrow}>Appearance</Text>
        <Text style={styles.sectionTitle}>Theme</Text>
        <Text style={styles.sectionSubtitle}>
          Choose how LocalLoop looks on your device.
        </Text>

        <View style={styles.options}>
          {APPEARANCE_OPTIONS.map((option) => (
            <AppearanceOption
              key={option.id}
              option={option}
              selected={preference === option.id}
              onSelect={() => handleSelect(option.id)}
              styles={styles}
              theme={theme}
            />
          ))}
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>LocalLoop</Text>
          <Text style={styles.aboutText}>Version 1.0.0</Text>
          <Text style={styles.aboutText}>Discover and support local businesses near you.</Text>
        </View>
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
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
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
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center' as const,
      color: theme.text,
      fontSize: 17,
      fontFamily: BrandFonts.semiBold,
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    headerWordmark: {
      marginBottom: 10,
    },
    sectionEyebrow: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
      marginBottom: 8,
      marginTop: 8,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 28,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    sectionSubtitle: {
      color: theme.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      fontFamily: BrandFonts.regular,
      marginBottom: 24,
    },
    options: {
      gap: 12,
    },
    optionCard: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 14,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      ...theme.shadowCard,
    },
    optionCardSelected: {
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
    },
    optionCardPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    optionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.surfaceElevated,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    optionIconWrapSelected: {
      backgroundColor: theme.bg,
    },
    optionText: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.semiBold,
    },
    optionDescription: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    optionRadio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    aboutCard: {
      marginTop: 32,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 6,
      ...theme.shadowCard,
    },
    aboutTitle: {
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
    },
    aboutText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.regular,
    },
  });
}
