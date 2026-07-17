import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormField({ label, error, style, ...inputProps }: FormFieldProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={styles.placeholder.color}
        style={[styles.input, inputProps.multiline && styles.inputMultiline, style]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    error: {
      color: theme.danger,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
    },
  });
}
