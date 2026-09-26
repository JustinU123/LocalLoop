import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreenHeader } from '@/components/account/account-screen-header';
import { SectionHeader } from '@/components/account/section-header';
import { PrimaryButton } from '@/components/account/primary-button';
import { DateFormField } from '@/components/business/date-form-field';
import { FormFieldWithCounter } from '@/components/business/form-field-with-counter';
import { ItemVariationsField } from '@/components/business/item-variations-field';
import { MultiSelectChipGroup } from '@/components/business/multi-select-chip-group';
import { OptionChipGroup } from '@/components/business/option-chip-group';
import { ProductItemImageField } from '@/components/business/product-item-image-field';
import { UnsavedChangesDiscardModal } from '@/components/business/unsaved-changes-discard-modal';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { BrandFonts, type AppThemeTokens } from '@/constants/business-theme';
import {
  AVAILABILITY_OPTIONS,
  DIETARY_ALLERGEN_NOTE,
  DIETARY_TAG_OPTIONS,
  ITEM_DESCRIPTION_PLACEHOLDERS,
  ITEM_NAME_PLACEHOLDERS,
  ITEM_TYPE_OPTIONS,
  MENU_ITEM_CATEGORIES,
  PRODUCT_CATEGORIES,
  PRODUCT_ITEM_FIELD_LIMITS,
  PURCHASE_METHOD_OPTIONS,
} from '@/constants/product-item-create';
import {
  useCanCreateBusinessContent,
  useVerifiedBusinessProductItemGuard,
} from '@/hooks/use-verified-business-create-guard';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { businessMenuItemToProductItemDraft, getOwnerMenuItemById } from '@/services/menuItems';
import type { ProductItemDraft, ProductItemType } from '@/types/product-item-draft';
import { parseIsoDate, serializeIsoDate, todayStart } from '@/utils/date-time';
import {
  beginMenuItemEdit,
  clearMenuItemEditSession,
  clearProductItemDraft,
  createEmptyProductItemDraft,
  getItemNameLabel,
  getMenuItemEditSession,
  getProductItemDraft,
  isProductItemFormEmpty,
  setProductItemDraft,
  validateProductItemForm,
} from '@/utils/product-item-form';

export default function BusinessCreateProductItemScreen() {
  useVerifiedBusinessProductItemGuard();
  const canCreate = useCanCreateBusinessContent();
  const styles = useThemedStyles(createStyles);
  const { editId: editIdParam } = useLocalSearchParams<{ editId?: string | string[] }>();
  const editId = Array.isArray(editIdParam) ? (editIdParam[0] ?? '') : (editIdParam ?? '');
  const isEditing = Boolean(editId);

  const [form, setForm] = useState<ProductItemDraft>(
    () => getProductItemDraft() ?? createEmptyProductItemDraft(),
  );
  const [loadingEdit, setLoadingEdit] = useState(isEditing);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  const { valid, errors } = useMemo(() => validateProductItemForm(form), [form]);
  const isDirty = useMemo(() => {
    if (isEditing && initialSnapshot) {
      return JSON.stringify(form) !== initialSnapshot;
    }
    return !isProductItemFormEmpty(form);
  }, [form, initialSnapshot, isEditing]);

  const { attemptBack, discardModalProps } = useUnsavedChangesGuard({
    isDirty,
    title: 'Discard this item?',
    onDiscard: clearProductItemDraft,
  });

  const today = useMemo(() => todayStart(), []);

  const categoryOptions = useMemo(() => {
    const categories = form.itemType === 'product' ? PRODUCT_CATEGORIES : MENU_ITEM_CATEGORIES;
    return categories.map((category) => ({ id: category, label: category }));
  }, [form.itemType]);

  useEffect(() => {
    if (!isEditing) {
      clearMenuItemEditSession();
      return;
    }

    let cancelled = false;

    async function loadForEdit() {
      const session = getMenuItemEditSession();
      if (session?.menuItemId === editId && getProductItemDraft()) {
        const draft = getProductItemDraft()!;
        if (!cancelled) {
          setForm(draft);
          setInitialSnapshot(JSON.stringify(draft));
          setLoadingEdit(false);
        }
        return;
      }

      const result = await getOwnerMenuItemById(editId);
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setEditLoadError(result.message);
        setLoadingEdit(false);
        return;
      }

      const draft = businessMenuItemToProductItemDraft(result.item);
      beginMenuItemEdit(result.item.id, draft, result.item.imageUrl);
      setForm(draft);
      setInitialSnapshot(JSON.stringify(draft));
      setLoadingEdit(false);
    }

    void loadForEdit();

    return () => {
      cancelled = true;
    };
  }, [editId, isEditing]);

  const screenTitle = isEditing ? 'Edit Menu Item' : 'New Product or Menu Item';

  const limitedTimeEndMinimum = useMemo(() => {
    const startDate = parseIsoDate(form.limitedTimeStartDate);
    if (startDate && startDate >= today) {
      return startDate;
    }
    return today;
  }, [form.limitedTimeStartDate, today]);

  const updateField = <K extends keyof ProductItemDraft>(key: K, value: ProductItemDraft[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleItemTypeChange = (itemType: ProductItemType) => {
    setForm((current) => {
      const categories = itemType === 'product' ? PRODUCT_CATEGORIES : MENU_ITEM_CATEGORIES;
      const categoryStillValid = categories.includes(current.category as never);
      return {
        ...current,
        itemType,
        category: categoryStillValid ? current.category : '',
        dietaryTags: itemType === 'menu-item' ? current.dietaryTags : [],
        brand: itemType === 'product' ? current.brand : '',
        material: itemType === 'product' ? current.material : '',
        sizeInformation: itemType === 'product' ? current.sizeInformation : '',
      };
    });
  };

  const handleLimitedTimeToggle = (enabled: boolean) => {
    setForm((current) => {
      const next = { ...current, isLimitedTime: enabled };
      if (!enabled) {
        next.limitedTimeStartDate = null;
        next.limitedTimeEndDate = null;
        return next;
      }
      if (!next.limitedTimeStartDate && next.availabilityStatus === 'available-now') {
        next.limitedTimeStartDate = serializeIsoDate(today);
      }
      return next;
    });
  };

  const handleContinue = () => {
    if (!valid || !canCreate) {
      return;
    }

    setProductItemDraft(form);
    router.push('/business-product-item-preview');
  };

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title={screenTitle} onBackPress={attemptBack} />
        <UnsavedChangesDiscardModal {...discardModalProps} />
      </SafeAreaView>
    );
  }

  if (isEditing && loadingEdit) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title={screenTitle} onBackPress={attemptBack} />
        <View style={styles.loadingEdit}>
          <Text style={styles.loadingEditText}>Loading item…</Text>
        </View>
        <UnsavedChangesDiscardModal {...discardModalProps} />
      </SafeAreaView>
    );
  }

  if (isEditing && editLoadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AccountScreenHeader title={screenTitle} onBackPress={attemptBack} />
        <View style={styles.loadingEdit}>
          <Text style={styles.loadingEditText}>{editLoadError}</Text>
        </View>
        <UnsavedChangesDiscardModal {...discardModalProps} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AccountScreenHeader title={screenTitle} onBackPress={attemptBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}>
          <Text style={styles.intro}>
            {isEditing
              ? 'Update this menu item. Review your changes on the next screen before saving.'
              : 'Highlight a new product or menu item for your business profile. Menu items publish to your profile; product publishing is not connected yet.'}
          </Text>

          {!isEditing ? (
            <OptionChipGroup
              label="What are you adding?"
              options={ITEM_TYPE_OPTIONS}
              value={form.itemType}
              onChange={handleItemTypeChange}
            />
          ) : null}

          <ProductItemImageField
            imageUri={form.imageUri}
            onChange={(uri) => updateField('imageUri', uri)}
            error={errors.imageUri}
          />

          <FormFieldWithCounter
            label={getItemNameLabel(form.itemType)}
            value={form.name}
            maxLength={PRODUCT_ITEM_FIELD_LIMITS.name}
            onChangeText={(value) => updateField('name', value)}
            placeholder={ITEM_NAME_PLACEHOLDERS[form.itemType]}
            error={errors.name}
          />

          <FormFieldWithCounter
            label="Description"
            value={form.description}
            maxLength={PRODUCT_ITEM_FIELD_LIMITS.description}
            onChangeText={(value) => updateField('description', value)}
            placeholder={ITEM_DESCRIPTION_PLACEHOLDERS[form.itemType]}
            multiline
            error={errors.description}
          />

          <SectionHeader label="Pricing" hint="Set the item price or mark it as variable." />

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Price varies</Text>
              <Text style={styles.toggleHint}>Hide the exact price and show “Price varies.”</Text>
            </View>
            <Switch
              value={form.priceVaries}
              onValueChange={(value) => updateField('priceVaries', value)}
              trackColor={{ false: styles.switchTrackOff.color, true: styles.switchTrackOn.color }}
              thumbColor={styles.switchThumb.color}
            />
          </View>

          {!form.priceVaries ? (
            <FormFieldWithCounter
              label="Price"
              value={form.price}
              maxLength={10}
              onChangeText={(value) => updateField('price', value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              keyboardType="decimal-pad"
              helperText="Enter 0.00 for free items."
              error={errors.price}
            />
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Preview price</Text>
              <Text style={styles.infoValue}>Price varies</Text>
            </View>
          )}

          <OptionChipGroup
            label="Category"
            options={categoryOptions}
            value={form.category}
            onChange={(value) => updateField('category', value)}
            error={errors.category}
          />

          <SectionHeader label="Availability" hint="Tell customers when this item is available." />

          <OptionChipGroup
            label="Availability Status"
            options={AVAILABILITY_OPTIONS}
            value={form.availabilityStatus}
            onChange={(value) => {
              updateField('availabilityStatus', value);
              if (value !== 'coming-soon') {
                updateField('availableDate', null);
              }
              if (value !== 'limited-availability') {
                updateField('quantityAvailable', '');
              }
            }}
            error={errors.availabilityStatus}
          />

          {form.availabilityStatus === 'coming-soon' ? (
            <DateFormField
              label="Available Date"
              value={form.availableDate}
              minimumDate={today}
              onChange={(value) => updateField('availableDate', value)}
              error={errors.availableDate}
            />
          ) : null}

          {form.availabilityStatus === 'limited-availability' ? (
            <FormFieldWithCounter
              label="Quantity Available"
              value={form.quantityAvailable}
              maxLength={6}
              onChangeText={(value) => updateField('quantityAvailable', value.replace(/[^0-9]/g, ''))}
              placeholder="25"
              keyboardType="number-pad"
              helperText="Optional for now."
              error={errors.quantityAvailable}
            />
          ) : null}

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Available for a limited time</Text>
              <Text style={styles.toggleHint}>Show a start and end date for seasonal items.</Text>
            </View>
            <Switch
              value={form.isLimitedTime}
              onValueChange={handleLimitedTimeToggle}
              trackColor={{ false: styles.switchTrackOff.color, true: styles.switchTrackOn.color }}
              thumbColor={styles.switchThumb.color}
            />
          </View>

          {form.isLimitedTime ? (
            <>
              <DateFormField
                label="Start Date"
                value={form.limitedTimeStartDate}
                minimumDate={today}
                onChange={(value) => updateField('limitedTimeStartDate', value)}
                error={errors.limitedTimeStartDate}
              />
              <DateFormField
                label="End Date"
                value={form.limitedTimeEndDate}
                minimumDate={limitedTimeEndMinimum}
                onChange={(value) => updateField('limitedTimeEndDate', value)}
                error={errors.limitedTimeEndDate}
              />
            </>
          ) : null}

          <ItemVariationsField
            variations={form.variations}
            onChange={(variations) => updateField('variations', variations)}
            errors={errors}
          />

          {form.itemType === 'menu-item' ? (
            <>
              <SectionHeader label="Dietary Information" hint="Optional tags for menu items." />
              <MultiSelectChipGroup
                label="Dietary Tags"
                options={DIETARY_TAG_OPTIONS}
                value={form.dietaryTags}
                onChange={(value) => updateField('dietaryTags', value)}
                helperText={DIETARY_ALLERGEN_NOTE}
              />
            </>
          ) : null}

          {form.itemType === 'product' ? (
            <>
              <SectionHeader label="Product Details" hint="Optional details for retail products." />
              <FormFieldWithCounter
                label="Brand"
                value={form.brand}
                maxLength={PRODUCT_ITEM_FIELD_LIMITS.productDetail}
                onChangeText={(value) => updateField('brand', value)}
                placeholder="LocalLoop Goods"
                error={errors.brand}
              />
              <FormFieldWithCounter
                label="Material"
                value={form.material}
                maxLength={PRODUCT_ITEM_FIELD_LIMITS.productDetail}
                onChangeText={(value) => updateField('material', value)}
                placeholder="100% organic cotton"
                error={errors.material}
              />
              <FormFieldWithCounter
                label="Size Information"
                value={form.sizeInformation}
                maxLength={PRODUCT_ITEM_FIELD_LIMITS.productDetail}
                onChangeText={(value) => updateField('sizeInformation', value)}
                placeholder="Available in S–XL"
                error={errors.sizeInformation}
              />
            </>
          ) : null}

          <SectionHeader
            label="Purchase or Order"
            hint="How customers can get this item from your business."
          />

          <MultiSelectChipGroup
            label="How can customers get this item?"
            options={PURCHASE_METHOD_OPTIONS}
            value={form.purchaseMethods}
            onChange={(value) => {
              updateField('purchaseMethods', value);
              if (!value.includes('order-online')) {
                updateField('productLink', '');
              }
              if (!value.includes('delivery')) {
                updateField('deliveryNotes', '');
              }
            }}
            error={errors.purchaseMethods}
          />

          {form.purchaseMethods.includes('order-online') ? (
            <FormFieldWithCounter
              label="Product Link"
              value={form.productLink}
              maxLength={300}
              onChangeText={(value) => updateField('productLink', value)}
              placeholder="https://shop.example.com/item"
              autoCapitalize="none"
              keyboardType="url"
              error={errors.productLink}
            />
          ) : null}

          {form.purchaseMethods.includes('delivery') ? (
            <FormFieldWithCounter
              label="Delivery Notes"
              value={form.deliveryNotes}
              maxLength={150}
              onChangeText={(value) => updateField('deliveryNotes', value)}
              placeholder="Available within 5 miles."
            />
          ) : null}

          <FormFieldWithCounter
            label="Additional Information"
            value={form.additionalInformation}
            maxLength={PRODUCT_ITEM_FIELD_LIMITS.additionalInformation}
            onChangeText={(value) => updateField('additionalInformation', value)}
            placeholder="Available while supplies last."
            multiline
            error={errors.additionalInformation}
          />
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={isEditing ? 'Review Changes' : 'Continue'}
            onPress={handleContinue}
            disabled={!valid}
          />
        </View>
      </KeyboardAvoidingView>
      <UnsavedChangesDiscardModal {...discardModalProps} />
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
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    toggleText: {
      flex: 1,
      gap: 4,
    },
    toggleLabel: {
      color: theme.text,
      fontSize: 15,
      fontFamily: BrandFonts.semiBold,
    },
    toggleHint: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: BrandFonts.regular,
    },
    switchTrackOff: {
      color: theme.border,
    },
    switchTrackOn: {
      color: theme.emerald,
    },
    switchThumb: {
      color: theme.surface,
    },
    infoCard: {
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 6,
    },
    infoLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: BrandFonts.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    infoValue: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: BrandFonts.medium,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      backgroundColor: theme.bg,
    },
    loadingEdit: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    loadingEditText: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: BrandFonts.regular,
      textAlign: 'center',
    },
  });
}
