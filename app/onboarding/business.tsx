import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { setOnboardingComplete } from '@/utils/onboarding-storage';

const CATEGORIES = ['Food', 'Coffee', 'Clothing', 'Beauty', 'Fitness', 'Other'];

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  styles,
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'url';
  styles: ReturnType<typeof createStyles>;
  theme: AppThemeTokens;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

export default function BusinessOnboardingScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Coffee');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  const finishOnboarding = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setOnboardingComplete();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(450)}>
            <Text style={styles.eyebrow}>Business setup</Text>
            <Text style={styles.title}>Tell us about your business</Text>
            <Text style={styles.subtitle}>
              This is a placeholder flow. Your profile details can be edited later.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.form}>
            <FormField
              label="Business name"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Sunrise Roasters"
              styles={styles}
              theme={theme}
            />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.chipsWrap}>
                {CATEGORIES.map((item) => {
                  const selected = category === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCategory(item);
                      }}
                      style={[styles.chip, selected && styles.chipSelected]}>
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <FormField
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="3922 W Sunset Blvd, Los Angeles, CA"
              styles={styles}
              theme={theme}
            />
            <FormField
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="(323) 555-0100"
              keyboardType="phone-pad"
              styles={styles}
              theme={theme}
            />
            <FormField
              label="Website"
              value={website}
              onChangeText={setWebsite}
              placeholder="yourbusiness.com"
              keyboardType="url"
              styles={styles}
              theme={theme}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140).duration(450)} style={styles.footer}>
            <Pressable
              onPress={finishOnboarding}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
              <Text style={styles.primaryButtonText}>Create Business Profile</Text>
              <Ionicons name="arrow-forward" size={18} color={theme.onEmerald} />
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    flex: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    eyebrow: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.bold,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
      marginBottom: 8,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontFamily: BrandFonts.bold,
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      fontFamily: BrandFonts.regular,
      marginBottom: 20,
    },
    form: {
      gap: 14,
      flex: 1,
    },
    field: {
      gap: 8,
    },
    fieldLabel: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    input: {
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      color: theme.text,
      fontSize: 16,
      fontFamily: BrandFonts.regular,
    },
    chipsWrap: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    chipSelected: {
      backgroundColor: theme.emerald,
      borderColor: theme.emerald,
    },
    chipText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: BrandFonts.semiBold,
    },
    chipTextSelected: {
      color: theme.onEmerald,
    },
    footer: {
      paddingVertical: 16,
    },
    primaryButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      height: 52,
      borderRadius: 14,
      backgroundColor: theme.emerald,
      ...theme.shadowButton,
    },
    primaryButtonPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    primaryButtonText: {
      color: theme.onEmerald,
      fontSize: 16,
      fontFamily: BrandFonts.bold,
    },
  });
}
