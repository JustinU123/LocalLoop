import { Keyboard, ScrollView, StyleSheet, Text } from 'react-native';

import { DateFormField } from '@/components/business/date-form-field';
import { TimeFormField } from '@/components/business/time-form-field';
import { FormFieldWithCounter } from '@/components/business/form-field-with-counter';
import { PromotionImageField } from '@/components/business/promotion-image-field';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import { PROMOTION_FIELD_LIMITS } from '@/constants/promotion-create';
import type { PromotionDraft, PromotionFormErrors } from '@/types/promotion-draft';
import { useThemedStyles } from '@/hooks/use-themed-styles';

type PromotionFormFieldsProps = {
  form: PromotionDraft;
  errors: PromotionFormErrors;
  intro?: string;
  onChange: <K extends keyof PromotionDraft>(key: K, value: PromotionDraft[K]) => void;
};

export function PromotionFormFields({ form, errors, intro, onChange }: PromotionFormFieldsProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={Keyboard.dismiss}>
      {intro ? <Text style={styles.intro}>{intro}</Text> : null}

      <PromotionImageField imageUri={form.imageUri} onChange={(uri) => onChange('imageUri', uri)} />

      <FormFieldWithCounter
        label="Promotion Title"
        value={form.title}
        maxLength={PROMOTION_FIELD_LIMITS.title}
        onChangeText={(value) => onChange('title', value)}
        placeholder="Buy One, Get One Free"
        error={errors.title}
      />

      <FormFieldWithCounter
        label="Description"
        value={form.description}
        maxLength={PROMOTION_FIELD_LIMITS.description}
        onChangeText={(value) => onChange('description', value)}
        placeholder="Purchase any large drink and receive a second drink free."
        multiline
        error={errors.description}
      />

      <DateFormField
        label="Start Date"
        value={form.startDate}
        onChange={(value) => onChange('startDate', value)}
        error={errors.startDate}
      />

      <TimeFormField
        label="Start Time"
        value={form.startTime}
        onChange={(value) => onChange('startTime', value)}
        error={errors.startTime}
      />

      <DateFormField
        label="End Date"
        value={form.endDate}
        onChange={(value) => onChange('endDate', value)}
        error={errors.endDate}
        minimumDate={form.startDate ? new Date(form.startDate) : undefined}
      />

      <TimeFormField
        label="End Time"
        value={form.endTime}
        onChange={(value) => onChange('endTime', value)}
        error={errors.endTime}
      />

      <FormFieldWithCounter
        label="Promotion Code"
        value={form.promotionCode}
        maxLength={PROMOTION_FIELD_LIMITS.promotionCode}
        onChangeText={(value) => onChange('promotionCode', value.toUpperCase())}
        placeholder="LOCAL20"
        autoCapitalize="characters"
        helperText="Leave blank if no code is required."
        error={errors.promotionCode}
      />

      <FormFieldWithCounter
        label="Redemption Instructions"
        value={form.redemptionInstructions}
        maxLength={PROMOTION_FIELD_LIMITS.redemptionInstructions}
        onChangeText={(value) => onChange('redemptionInstructions', value)}
        placeholder="Show this promotion to the cashier before checkout."
        multiline
        error={errors.redemptionInstructions}
      />

      <FormFieldWithCounter
        label="Terms and Conditions"
        value={form.termsAndConditions}
        maxLength={PROMOTION_FIELD_LIMITS.termsAndConditions}
        onChangeText={(value) => onChange('termsAndConditions', value)}
        placeholder="Limit one per customer. Cannot be combined with other offers."
        multiline
        error={errors.termsAndConditions}
      />
    </ScrollView>
  );
}

function createStyles(theme: AppThemeTokens) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 16,
    },
    intro: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
    },
  });
}
