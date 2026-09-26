import {
  AVAILABILITY_OPTIONS,
  PRODUCT_ITEM_FIELD_LIMITS,
  PURCHASE_METHOD_OPTIONS,
} from '@/constants/product-item-create';
import type {
  AvailabilityStatus,
  ProductItemDraft,
  ProductItemFormErrors,
  ProductItemType,
  PurchaseMethod,
} from '@/types/product-item-draft';
import { EMPTY_PRODUCT_ITEM_DRAFT } from '@/types/product-item-draft';
import { formatDisplayDate, isValidUrl, parseIsoDate, startOfDay, todayStart } from '@/utils/date-time';

let draft: ProductItemDraft | null = null;

let editingMenuItemId: string | null = null;
let originalMenuItemImageUrl: string | null = null;

export type MenuItemEditSession = {
  menuItemId: string;
  originalImageUrl: string | null;
};

export function beginMenuItemEdit(menuItemId: string, draftValues: ProductItemDraft, imageUrl: string | null) {
  editingMenuItemId = menuItemId;
  originalMenuItemImageUrl = imageUrl;
  draft = draftValues;
}

export function getMenuItemEditSession(): MenuItemEditSession | null {
  if (!editingMenuItemId) {
    return null;
  }

  return {
    menuItemId: editingMenuItemId,
    originalImageUrl: originalMenuItemImageUrl,
  };
}

export function clearMenuItemEditSession() {
  editingMenuItemId = null;
  originalMenuItemImageUrl = null;
}

export function setProductItemDraft(next: ProductItemDraft) {
  draft = next;
}

export function getProductItemDraft(): ProductItemDraft | null {
  return draft;
}

export function clearProductItemDraft() {
  draft = null;
  clearMenuItemEditSession();
}

export function createEmptyProductItemDraft(): ProductItemDraft {
  return { ...EMPTY_PRODUCT_ITEM_DRAFT, variations: [], dietaryTags: [], purchaseMethods: [] };
}

export function getItemTypeLabel(itemType: ProductItemType): string {
  return itemType === 'product' ? 'Product' : 'Menu Item';
}

export function getItemNameLabel(itemType: ProductItemType): string {
  return itemType === 'product' ? 'Product Name' : 'Menu Item Name';
}

export function getAvailabilityLabel(status: AvailabilityStatus): string {
  return AVAILABILITY_OPTIONS.find((option) => option.id === status)?.label ?? status;
}

export function getPurchaseMethodLabel(method: PurchaseMethod): string {
  return PURCHASE_METHOD_OPTIONS.find((option) => option.id === method)?.label ?? method;
}

export function formatItemPrice(price: string): string | null {
  const value = Number(price);
  if (price.trim() === '' || Number.isNaN(value) || value < 0) {
    return null;
  }

  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });
}

export function getPriceDisplayLabel(form: ProductItemDraft): string {
  if (form.priceVaries) {
    return 'Price varies';
  }

  return formatItemPrice(form.price) ?? '$0.00';
}

export function parseVariationValues(values: string): string[] {
  return values
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function createVariationId(): string {
  return `variation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isProductItemFormEmpty(form: ProductItemDraft): boolean {
  return (
    form.itemType === 'menu-item' &&
    !form.imageUri &&
    !form.name.trim() &&
    !form.description.trim() &&
    !form.price.trim() &&
    !form.priceVaries &&
    !form.category &&
    form.availabilityStatus === 'available-now' &&
    !form.availableDate &&
    !form.quantityAvailable.trim() &&
    !form.isLimitedTime &&
    !form.limitedTimeStartDate &&
    !form.limitedTimeEndDate &&
    form.variations.length === 0 &&
    form.dietaryTags.length === 0 &&
    !form.brand.trim() &&
    !form.material.trim() &&
    !form.sizeInformation.trim() &&
    form.purchaseMethods.length === 0 &&
    !form.productLink.trim() &&
    !form.deliveryNotes.trim() &&
    !form.additionalInformation.trim()
  );
}

export function validateProductItemForm(form: ProductItemDraft): {
  valid: boolean;
  errors: ProductItemFormErrors;
} {
  const errors: ProductItemFormErrors = {};

  if (!form.imageUri) {
    errors.imageUri = 'Item image is required.';
  }

  if (!form.name.trim()) {
    errors.name = 'Item name is required.';
  } else if (form.name.length > PRODUCT_ITEM_FIELD_LIMITS.name) {
    errors.name = `Maximum ${PRODUCT_ITEM_FIELD_LIMITS.name} characters.`;
  }

  if (!form.description.trim()) {
    errors.description = 'Description is required.';
  } else if (form.description.length > PRODUCT_ITEM_FIELD_LIMITS.description) {
    errors.description = `Maximum ${PRODUCT_ITEM_FIELD_LIMITS.description} characters.`;
  }

  if (!form.priceVaries) {
    const price = Number(form.price);
    if (form.price.trim() === '' || Number.isNaN(price) || price < 0) {
      errors.price = 'Enter a valid price of zero or greater.';
    }
  }

  if (!form.category) {
    errors.category = 'Category is required.';
  }

  if (!form.availabilityStatus) {
    errors.availabilityStatus = 'Availability status is required.';
  }

  const today = todayStart();

  if (form.availabilityStatus === 'coming-soon') {
    const availableDate = parseIsoDate(form.availableDate);
    if (!form.availableDate) {
      errors.availableDate = 'Available date is required.';
    } else if (availableDate && startOfDay(availableDate) < today) {
      errors.availableDate = 'Available date cannot be in the past.';
    }
  }

  if (form.availabilityStatus === 'limited-availability' && form.quantityAvailable.trim()) {
    const quantity = Number(form.quantityAvailable);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors.quantityAvailable = 'Quantity must be a positive whole number.';
    }
  }

  if (form.isLimitedTime) {
    const startDate = parseIsoDate(form.limitedTimeStartDate);
    const endDate = parseIsoDate(form.limitedTimeEndDate);

    if (!form.limitedTimeStartDate) {
      errors.limitedTimeStartDate = 'Start date is required.';
    } else if (startDate && startOfDay(startDate) < today) {
      errors.limitedTimeStartDate = 'Start date cannot be in the past.';
    }

    if (!form.limitedTimeEndDate) {
      errors.limitedTimeEndDate = 'End date is required.';
    } else if (startDate && endDate && startOfDay(endDate) < startOfDay(startDate)) {
      errors.limitedTimeEndDate = 'End date cannot be before start date.';
    }
  }

  form.variations.forEach((variation) => {
    if (!variation.name.trim()) {
      errors[`variationName-${variation.id}`] = 'Option name is required.';
    }
    if (!variation.values.trim()) {
      errors[`variationValues-${variation.id}`] = 'Enter at least one value.';
    }
  });

  if (form.brand.length > PRODUCT_ITEM_FIELD_LIMITS.productDetail) {
    errors.brand = `Maximum ${PRODUCT_ITEM_FIELD_LIMITS.productDetail} characters.`;
  }
  if (form.material.length > PRODUCT_ITEM_FIELD_LIMITS.productDetail) {
    errors.material = `Maximum ${PRODUCT_ITEM_FIELD_LIMITS.productDetail} characters.`;
  }
  if (form.sizeInformation.length > PRODUCT_ITEM_FIELD_LIMITS.productDetail) {
    errors.sizeInformation = `Maximum ${PRODUCT_ITEM_FIELD_LIMITS.productDetail} characters.`;
  }

  if (form.purchaseMethods.length === 0) {
    errors.purchaseMethods = 'Select at least one purchase or order method.';
  }

  if (form.purchaseMethods.includes('order-online') && !isValidUrl(form.productLink)) {
    errors.productLink = 'Enter a valid product link.';
  }

  if (form.additionalInformation.length > PRODUCT_ITEM_FIELD_LIMITS.additionalInformation) {
    errors.additionalInformation = `Maximum ${PRODUCT_ITEM_FIELD_LIMITS.additionalInformation} characters.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export { formatDisplayDate };
