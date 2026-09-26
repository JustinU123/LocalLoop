import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatDisplayDate, serializeIsoDate } from '@/utils/date-time';

type DateFormFieldProps = {
  label: string;
  value: string | null;
  error?: string;
  onChange: (isoDate: string) => void;
  minimumDate?: Date;
};

export function DateFormField({
  label,
  value,
  error,
  onChange,
  minimumDate,
}: DateFormFieldProps) {
  const styles = useThemedStyles(createStyles);
  const { theme, resolvedScheme } = useAppTheme();
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = value ? new Date(value) : minimumDate ?? new Date();

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'dismissed' || !date) {
      return;
    }

    onChange(serializeIsoDate(date));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setShowPicker(true);
        }}
        style={({ pressed }) => [styles.input, pressed && styles.inputPressed, error && styles.inputError]}>
        <Text style={[styles.value, !value && styles.placeholder]}>{formatDisplayDate(value)}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {showPicker ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={minimumDate}
            onChange={handleChange}
            {...(Platform.OS === 'ios'
              ? { themeVariant: resolvedScheme, textColor: theme.text }
              : {})}
          />
          {Platform.OS === 'ios' ? (
            <Pressable onPress={() => setShowPicker(false)} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      gap: 8,
    },
    label: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    input: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    inputPressed: {
      backgroundColor: theme.surfaceElevated,
    },
    inputError: {
      borderColor: theme.danger,
    },
    value: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.regular,
    },
    placeholder: {
      color: theme.textSecondary,
    },
    error: {
      color: theme.danger,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
    },
    pickerWrap: {
      backgroundColor: theme.surface,
      borderRadius: BrandRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    doneButton: {
      alignItems: 'center',
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      backgroundColor: theme.surfaceElevated,
    },
    doneButtonText: {
      color: theme.emerald,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
  });
}
