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

import { BusinessTheme as T } from '@/constants/business-theme';
import { setOnboardingComplete } from '@/utils/onboarding-storage';

const CATEGORIES = ['Food', 'Coffee', 'Clothing', 'Beauty', 'Fitness', 'Other'];

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'url';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T.textMuted}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
  );
}

export default function BusinessOnboardingScreen() {
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
            />
            <FormField
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="(323) 555-0100"
              keyboardType="phone-pad"
            />
            <FormField
              label="Website"
              value={website}
              onChangeText={setWebsite}
              placeholder="yourbusiness.com"
              keyboardType="url"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140).duration(450)} style={styles.footer}>
            <Pressable
              onPress={finishOnboarding}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
              <Text style={styles.primaryButtonText}>Create Business Profile</Text>
              <Ionicons name="arrow-forward" size={18} color="#052E1C" />
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
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
    color: T.emerald,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: T.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: T.textSecondary,
    fontSize: 16,
    lineHeight: 24,
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
    color: T.text,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 14,
    color: T.text,
    fontSize: 16,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.borderLight,
  },
  chipSelected: {
    backgroundColor: T.emerald,
    borderColor: T.emerald,
  },
  chipText: {
    color: T.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#052E1C',
  },
  footer: {
    paddingVertical: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: T.emerald,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#052E1C',
    fontSize: 16,
    fontWeight: '700',
  },
});
