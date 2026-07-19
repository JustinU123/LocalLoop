import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { formatDisplayTime, parseTimeValue, serializeTimeValue } from '@/utils/date-time';

type TimeFormFieldProps = {
  label: string;
  value: string | null;
  error?: string;
  onChange: (timeValue: string) => void;
};

export function TimeFormField({ label, value, error, onChange }: TimeFormFieldProps) {
  const styles = useThemedStyles(createStyles);
  const [showPicker, setShowPicker] = useState(false);
  const selectedTime = useMemo(() => {
    const parsed = parseTimeValue(value);
    const date = new Date();
    if (parsed) {
      date.setHours(parsed.hours, parsed.minutes, 0, 0);
    }
    return date;
  }, [value]);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'dismissed' || !date) {
      return;
    }

    onChange(serializeTimeValue(date));
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
        <Text style={[styles.value, !value && styles.placeholder]}>{formatDisplayTime(value)}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {showPicker ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
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
