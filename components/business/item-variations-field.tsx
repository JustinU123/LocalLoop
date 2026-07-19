import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandFonts, BrandRadius, type AppThemeTokens } from '@/constants/business-theme';
import { PRODUCT_ITEM_FIELD_LIMITS } from '@/constants/product-item-create';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { ProductItemFormErrors, ProductItemVariation } from '@/types/product-item-draft';
import { createVariationId } from '@/utils/product-item-form';

type ItemVariationsFieldProps = {
  variations: ProductItemVariation[];
  onChange: (variations: ProductItemVariation[]) => void;
  errors: ProductItemFormErrors;
};

export function ItemVariationsField({ variations, onChange, errors }: ItemVariationsFieldProps) {
  const styles = useThemedStyles(createStyles);
  const canAddMore = variations.length < PRODUCT_ITEM_FIELD_LIMITS.maxVariations;

  const updateVariation = (id: string, patch: Partial<ProductItemVariation>) => {
    onChange(variations.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeVariation = (id: string) => {
    Haptics.selectionAsync();
    onChange(variations.filter((item) => item.id !== id));
  };

  const addVariation = () => {
    if (!canAddMore) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange([...variations, { id: createVariationId(), name: '', values: '' }]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Options or Variations</Text>
      <Text style={styles.helperText}>
        Add simple option groups such as sizes, colors, or milk choices.
      </Text>

      {variations.map((variation, index) => (
        <View key={variation.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Option {index + 1}</Text>
            <Pressable onPress={() => removeVariation(variation.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={styles.removeIcon.color} />
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>Option Name</Text>
          <TextInput
            value={variation.name}
            onChangeText={(value) => updateVariation(variation.id, { name: value })}
            placeholder="Size"
            placeholderTextColor={styles.placeholder.color}
            style={[
              styles.input,
              errors[`variationName-${variation.id}`] && styles.inputError,
            ]}
            maxLength={40}
          />
          {errors[`variationName-${variation.id}`] ? (
            <Text style={styles.error}>{errors[`variationName-${variation.id}`]}</Text>
          ) : null}

          <Text style={styles.fieldLabel}>Values</Text>
          <TextInput
            value={variation.values}
            onChangeText={(value) => updateVariation(variation.id, { values: value })}
            placeholder="Small, Medium, Large"
            placeholderTextColor={styles.placeholder.color}
            style={[
              styles.input,
              errors[`variationValues-${variation.id}`] && styles.inputError,
            ]}
          />
          {errors[`variationValues-${variation.id}`] ? (
            <Text style={styles.error}>{errors[`variationValues-${variation.id}`]}</Text>
          ) : null}
        </View>
      ))}

      <Pressable
        onPress={addVariation}
        disabled={!canAddMore}
        style={({ pressed }) => [
          styles.addButton,
          !canAddMore && styles.addButtonDisabled,
          pressed && canAddMore && styles.addButtonPressed,
        ]}>
        <Ionicons name="add-circle-outline" size={18} color={styles.addButtonText.color} />
        <Text style={styles.addButtonText}>
          {canAddMore ? 'Add Option' : `Maximum ${PRODUCT_ITEM_FIELD_LIMITS.maxVariations} options`}
        </Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    container: {
      gap: 10,
    },
    label: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    helperText: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    card: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.md,
      padding: 14,
      gap: 8,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: {
      color: theme.text,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    fieldLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    input: {
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BrandRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.regular,
    },
    inputError: {
      borderColor: theme.danger,
    },
    placeholder: {
      color: theme.textSecondary,
    },
    error: {
      color: theme.danger,
      fontSize: 13,
      fontFamily: BrandFonts.medium,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: theme.emerald,
      backgroundColor: theme.emeraldGlow,
      borderRadius: BrandRadius.md,
      paddingVertical: 12,
    },
    addButtonPressed: {
      opacity: 0.92,
    },
    addButtonDisabled: {
      opacity: 0.5,
    },
    addButtonText: {
      color: theme.emerald,
      fontSize: 14,
      fontFamily: BrandFonts.semiBold,
    },
    removeIcon: {
      color: theme.danger,
    },
  });
}
