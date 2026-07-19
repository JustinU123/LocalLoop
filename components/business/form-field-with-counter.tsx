import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type FormFieldWithCounterProps = TextInputProps & {
  label: string;
  value: string;
  maxLength: number;
  error?: string;
  helperText?: string;
};

export function FormFieldWithCounter({
  label,
  value,
  maxLength,
  error,
  helperText,
  style,
  ...inputProps
}: FormFieldWithCounterProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      </View>
      <TextInput
        value={value}
        maxLength={maxLength}
        placeholderTextColor={styles.placeholder.color}
        style={[styles.input, inputProps.multiline && styles.inputMultiline, style]}
        {...inputProps}
      />
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      gap: 8,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    label: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
      flex: 1,
    },
    counter: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.medium,
    },
    input: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.regular,
    },
    inputMultiline: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    placeholder: {
      color: theme.textSecondary,
    },
    helperText: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    error: {
      color: theme.danger,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
    },
  });
}
