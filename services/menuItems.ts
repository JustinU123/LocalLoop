import type { MenuSection } from '@/data/businesses';
import { supabase } from '@/lib/supabase';
import {
  deleteUploadedMenuImage,
  extractMenuImageStoragePath,
  uploadMenuImage,
} from '@/services/menuStorage';
import { getCurrentVerifiedBusiness } from '@/services/posts';
import type {
  BusinessMenuItem,
  MenuItemAvailabilityStatus,
  MenuItemRow,
  MenuItemVariationRow,
} from '@/types/supabase-menu-item';
import type { ProductItemDraft } from '@/types/product-item-draft';
import {
  createVariationId,
  parseVariationValues,
  validateProductItemForm,
} from '@/utils/product-item-form';

export type MenuItemErrorCode =
  | 'unauthenticated'
  | 'not_verified'
  | 'invalid_item'
  | 'no_image'
  | 'network'
  | 'upload_failed'
  | 'insert_failed'
  | 'update_failed'
  | 'delete_failed'
  | 'not_found'
  | 'unexpected';

export type PublishMenuItemResult =
  | { ok: true; item: BusinessMenuItem }
  | { ok: false; code: MenuItemErrorCode; message: string };

export type GetBusinessMenuItemsResult =
  | { ok: true; items: BusinessMenuItem[] }
  | { ok: false; code: MenuItemErrorCode; message: string };

export type ListOwnerMenuItemsResult = GetBusinessMenuItemsResult;

export type GetOwnerMenuItemResult =
  | { ok: true; item: BusinessMenuItem }
  | { ok: false; code: MenuItemErrorCode; message: string };

export type MutateOwnerMenuItemResult =
  | { ok: true; item?: BusinessMenuItem }
  | { ok: false; code: MenuItemErrorCode; message: string };

const MENU_ITEM_SELECT =
  'id, business_id, name, description, category, image_url, price_cents, price_varies, availability_status, available_date, is_limited_time, limited_time_start_date, limited_time_end_date, dietary_tags, variations, additional_information, status, created_at';

function logDevError(scope: string, error: unknown) {
  if (__DEV__) {
    console.error(`[menuItems:${scope}]`, error);
  }
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';

  return /network request failed|failed to fetch|network error/i.test(message);
}

function userFacingError(code: MenuItemErrorCode): string {
  switch (code) {
    case 'unauthenticated':
      return 'Please sign in again to publish.';
    case 'not_verified':
      return 'Your business must be verified before publishing menu items.';
    case 'invalid_item':
      return 'Complete all required menu item fields before publishing.';
    case 'no_image':
      return 'Select an item image before publishing.';
    case 'network':
      return 'Check your connection and try again.';
    case 'upload_failed':
      return "We couldn't upload your item image. Please try again.";
    case 'insert_failed':
      return "We couldn't publish your menu item. Please try again.";
    case 'update_failed':
      return "We couldn't save your item changes. Please try again.";
    case 'delete_failed':
      return "We couldn't delete this item. Please try again.";
    case 'not_found':
      return 'This item could not be found.';
    default:
      return "We couldn't publish your menu item. Please try again.";
  }
}

function isLocalImageUri(uri: string): boolean {
  const trimmed = uri.trim();
  return (
    trimmed.startsWith('file:') ||
    trimmed.startsWith('content:') ||
    trimmed.startsWith('ph://') ||
    trimmed.startsWith('assets-library:')
  );
}

function formatPriceFromCents(priceCents: number | null): string {
  if (priceCents === null || priceCents < 0) {
    return '';
  }

  const dollars = priceCents / 100;
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
}

export function businessMenuItemToProductItemDraft(item: BusinessMenuItem): ProductItemDraft {
  return {
    itemType: 'menu-item',
    imageUri: item.imageUrl,
    name: item.name,
    description: item.description,
    price: item.priceVaries ? '' : formatPriceFromCents(item.priceCents),
    priceVaries: item.priceVaries,
    category: item.category,
    availabilityStatus: item.availabilityStatus,
    availableDate: item.availableDate,
    quantityAvailable: '',
    isLimitedTime: item.isLimitedTime,
    limitedTimeStartDate: item.limitedTimeStartDate,
    limitedTimeEndDate: item.limitedTimeEndDate,
    variations: item.variations.map((variation, index) => ({
      id: createVariationId() + String(index),
      name: variation.name,
      values: variation.values.join(', '),
    })),
    dietaryTags: item.dietaryTags as ProductItemDraft['dietaryTags'],
    brand: '',
    material: '',
    sizeInformation: '',
    purchaseMethods: [],
    productLink: '',
    deliveryNotes: '',
    additionalInformation: item.additionalInformation ?? '',
  };
}

function buildMenuItemFieldsFromDraft(draft: ProductItemDraft, imageUrl: string) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    category: draft.category.trim(),
    image_url: imageUrl,
    price_cents: draft.priceVaries ? null : parsePriceCents(draft.price),
    price_varies: draft.priceVaries,
    availability_status: draft.availabilityStatus as MenuItemAvailabilityStatus,
    available_date: draft.availabilityStatus === 'coming-soon' ? draft.availableDate : null,
    is_limited_time: draft.isLimitedTime,
    limited_time_start_date: draft.isLimitedTime ? draft.limitedTimeStartDate : null,
    limited_time_end_date: draft.isLimitedTime ? draft.limitedTimeEndDate : null,
    dietary_tags: draft.dietaryTags,
    variations: mapDraftVariations(draft),
    additional_information: draft.additionalInformation.trim() || null,
  };
}

async function resolveMenuImageForSave(params: {
  draft: ProductItemDraft;
  businessId: string;
  userId: string;
  previousImageUrl: string | null;
}): Promise<
  | { ok: true; imageUrl: string; uploadedPath: string | null; previousPathToDelete: string | null }
  | { ok: false; code: MenuItemErrorCode; message: string }
> {
  const imageUri = params.draft.imageUri?.trim() ?? '';
  const previousPath = extractMenuImageStoragePath(params.previousImageUrl);

  if (!imageUri) {
    const fallback = params.previousImageUrl?.trim();
    if (!fallback) {
      return { ok: false, code: 'no_image', message: userFacingError('no_image') };
    }
    return {
      ok: true,
      imageUrl: fallback,
      uploadedPath: null,
      previousPathToDelete: null,
    };
  }

  if (isLocalImageUri(imageUri)) {
    const uploadResult = await uploadMenuImage({
      businessId: params.businessId,
      userId: params.userId,
      uri: imageUri,
    });

    if (!uploadResult.ok) {
      return {
        ok: false,
        code: 'upload_failed',
        message: uploadResult.message,
      };
    }

    return {
      ok: true,
      imageUrl: uploadResult.publicUrl,
      uploadedPath: uploadResult.path,
      previousPathToDelete: previousPath,
    };
  }

  const unchangedRemote = params.previousImageUrl?.trim() === imageUri;
  return {
    ok: true,
    imageUrl: imageUri,
    uploadedPath: null,
    previousPathToDelete: unchangedRemote ? null : previousPath,
  };
}

function parseVariations(value: unknown): MenuItemVariationRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const name = 'name' in entry ? String((entry as { name?: unknown }).name ?? '').trim() : '';
      const valuesRaw = 'values' in entry ? (entry as { values?: unknown }).values : [];
      const values = Array.isArray(valuesRaw)
        ? valuesRaw.map((item) => String(item).trim()).filter(Boolean)
        : [];

      if (!name || values.length === 0) {
        return null;
      }

      return { name, values };
    })
    .filter((entry): entry is MenuItemVariationRow => entry !== null);
}

function menuItemRowToBusinessMenuItem(row: MenuItemRow): BusinessMenuItem {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    description: row.description,
    category: row.category,
    imageUrl: row.image_url,
    priceCents: row.price_cents,
    priceVaries: row.price_varies,
    availabilityStatus: row.availability_status,
    availableDate: row.available_date,
    isLimitedTime: row.is_limited_time,
    limitedTimeStartDate: row.limited_time_start_date,
    limitedTimeEndDate: row.limited_time_end_date,
    dietaryTags: row.dietary_tags ?? [],
    variations: parseVariations(row.variations),
    additionalInformation: row.additional_information,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function formatMenuItemPrice(item: BusinessMenuItem): string {
  if (item.priceVaries) {
    return 'Price varies';
  }

  if (item.priceCents === null || item.priceCents < 0) {
    return '$0.00';
  }

  return (item.priceCents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });
}

export function groupMenuItemsIntoSections(items: BusinessMenuItem[]): MenuSection[] {
  const sections = new Map<string, BusinessMenuItem[]>();

  for (const item of items) {
    const title = item.category.trim() || 'Menu';
    const existing = sections.get(title) ?? [];
    existing.push(item);
    sections.set(title, existing);
  }

  return Array.from(sections.entries()).map(([title, sectionItems]) => ({
    title,
    items: sectionItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: formatMenuItemPrice(item),
      description: item.description,
      image: item.imageUrl,
    })),
  }));
}

function mapDraftVariations(draft: ProductItemDraft): MenuItemVariationRow[] {
  return draft.variations
    .map((variation) => ({
      name: variation.name.trim(),
      values: parseVariationValues(variation.values),
    }))
    .filter((variation) => variation.name && variation.values.length > 0);
}

function parsePriceCents(price: string): number | null {
  const value = Number(price);
  if (price.trim() === '' || Number.isNaN(value) || value < 0) {
    return null;
  }

  return Math.round(value * 100);
}

export async function publishMenuItem(draft: ProductItemDraft): Promise<PublishMenuItemResult> {
  if (draft.itemType !== 'menu-item') {
    return {
      ok: false,
      code: 'invalid_item',
      message: 'Product publishing is not connected yet. Switch to Menu Item to publish.',
    };
  }

  const { valid } = validateProductItemForm(draft);
  if (!valid) {
    return {
      ok: false,
      code: 'invalid_item',
      message: userFacingError('invalid_item'),
    };
  }

  if (!draft.imageUri?.trim()) {
    return {
      ok: false,
      code: 'no_image',
      message: userFacingError('no_image'),
    };
  }

  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    const code: MenuItemErrorCode =
      verified.code === 'unauthenticated' ||
      verified.code === 'not_verified' ||
      verified.code === 'network'
        ? verified.code
        : 'unexpected';
    return {
      ok: false,
      code,
      message:
        verified.code === 'not_verified' || verified.code === 'unauthenticated'
          ? userFacingError(verified.code)
          : verified.message,
    };
  }

  const { business, userId } = verified;

  const uploadResult = await uploadMenuImage({
    businessId: business.id,
    userId,
    uri: draft.imageUri,
  });

  if (!uploadResult.ok) {
    return {
      ok: false,
      code: 'upload_failed',
      message: uploadResult.message,
    };
  }

  const { path, publicUrl } = uploadResult;

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        business_id: business.id,
        name: draft.name.trim(),
        description: draft.description.trim(),
        category: draft.category.trim(),
        image_url: publicUrl,
        price_cents: draft.priceVaries ? null : parsePriceCents(draft.price),
        price_varies: draft.priceVaries,
        availability_status: draft.availabilityStatus as MenuItemAvailabilityStatus,
        available_date:
          draft.availabilityStatus === 'coming-soon' ? draft.availableDate : null,
        is_limited_time: draft.isLimitedTime,
        limited_time_start_date: draft.isLimitedTime ? draft.limitedTimeStartDate : null,
        limited_time_end_date: draft.isLimitedTime ? draft.limitedTimeEndDate : null,
        dietary_tags: draft.dietaryTags,
        variations: mapDraftVariations(draft),
        additional_information: draft.additionalInformation.trim() || null,
        status: 'published',
      })
      .select(MENU_ITEM_SELECT)
      .single();

    if (error) {
      logDevError('publishMenuItem.insert', error);
      await deleteUploadedMenuImage(path);
      const code: MenuItemErrorCode = isNetworkError(error) ? 'network' : 'insert_failed';
      return {
        ok: false,
        code,
        message: userFacingError(code),
      };
    }

    const item = menuItemRowToBusinessMenuItem(data as MenuItemRow);
    return { ok: true, item };
  } catch (error) {
    logDevError('publishMenuItem', error);
    await deleteUploadedMenuImage(path);
    const code = isNetworkError(error) ? 'network' : 'insert_failed';
    return {
      ok: false,
      code,
      message: userFacingError(code),
    };
  }
}

export async function getBusinessMenuItems(
  businessId: string,
): Promise<GetBusinessMenuItemsResult> {
  if (!businessId) {
    return { ok: true, items: [] };
  }

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select(MENU_ITEM_SELECT)
      .eq('business_id', businessId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      logDevError('getBusinessMenuItems', error);
      const code: MenuItemErrorCode = isNetworkError(error) ? 'network' : 'unexpected';
      return {
        ok: false,
        code,
        message: userFacingError(code),
      };
    }

    const items = ((data as MenuItemRow[] | null) ?? []).map(menuItemRowToBusinessMenuItem);
    return { ok: true, items };
  } catch (error) {
    logDevError('getBusinessMenuItems', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: userFacingError(isNetworkError(error) ? 'network' : 'unexpected'),
    };
  }
}

type VerifiedOwnerAccess =
  | { ok: true; businessId: string; userId: string }
  | { ok: false; code: MenuItemErrorCode; message: string };

async function requireVerifiedOwnerMenuAccess(): Promise<VerifiedOwnerAccess> {
  const verified = await getCurrentVerifiedBusiness();
  if (!verified.ok) {
    const code: MenuItemErrorCode =
      verified.code === 'unauthenticated' ||
      verified.code === 'not_verified' ||
      verified.code === 'network'
        ? verified.code
        : 'unexpected';
    return {
      ok: false,
      code,
      message:
        verified.code === 'not_verified' || verified.code === 'unauthenticated'
          ? userFacingError(verified.code)
          : verified.message,
    };
  }

  return {
    ok: true,
    businessId: verified.business.id,
    userId: verified.userId,
  };
}

export async function listOwnerMenuItems(): Promise<ListOwnerMenuItemsResult> {
  const owner = await requireVerifiedOwnerMenuAccess();
  if (!owner.ok) {
    return owner;
  }

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select(MENU_ITEM_SELECT)
      .eq('business_id', owner.businessId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false });

    if (error) {
      logDevError('listOwnerMenuItems', error);
      const code: MenuItemErrorCode = isNetworkError(error) ? 'network' : 'unexpected';
      return {
        ok: false,
        code,
        message: userFacingError(code),
      };
    }

    const items = ((data as MenuItemRow[] | null) ?? []).map(menuItemRowToBusinessMenuItem);
    return { ok: true, items };
  } catch (error) {
    logDevError('listOwnerMenuItems', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: userFacingError(isNetworkError(error) ? 'network' : 'unexpected'),
    };
  }
}

export async function getOwnerMenuItemById(menuItemId: string): Promise<GetOwnerMenuItemResult> {
  const trimmedId = menuItemId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const owner = await requireVerifiedOwnerMenuAccess();
  if (!owner.ok) {
    return owner;
  }

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select(MENU_ITEM_SELECT)
      .eq('id', trimmedId)
      .eq('business_id', owner.businessId)
      .maybeSingle();

    if (error) {
      logDevError('getOwnerMenuItemById', error);
      const code: MenuItemErrorCode = isNetworkError(error) ? 'network' : 'unexpected';
      return {
        ok: false,
        code,
        message: userFacingError(code),
      };
    }

    if (!data) {
      return { ok: false, code: 'not_found', message: userFacingError('not_found') };
    }

    return { ok: true, item: menuItemRowToBusinessMenuItem(data as MenuItemRow) };
  } catch (error) {
    logDevError('getOwnerMenuItemById', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'unexpected',
      message: userFacingError(isNetworkError(error) ? 'network' : 'unexpected'),
    };
  }
}

export async function updateOwnerMenuItem(
  menuItemId: string,
  draft: ProductItemDraft,
): Promise<PublishMenuItemResult> {
  const trimmedId = menuItemId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  if (draft.itemType !== 'menu-item') {
    return {
      ok: false,
      code: 'invalid_item',
      message: 'Product editing is not connected yet.',
    };
  }

  const { valid } = validateProductItemForm(draft);
  if (!valid) {
    return {
      ok: false,
      code: 'invalid_item',
      message: userFacingError('invalid_item'),
    };
  }

  const owner = await requireVerifiedOwnerMenuAccess();
  if (!owner.ok) {
    return owner;
  }

  const existing = await getOwnerMenuItemById(trimmedId);
  if (!existing.ok) {
    return existing;
  }

  const imageResolution = await resolveMenuImageForSave({
    draft,
    businessId: owner.businessId,
    userId: owner.userId,
    previousImageUrl: existing.item.imageUrl,
  });

  if (!imageResolution.ok) {
    return imageResolution;
  }

  const fields = buildMenuItemFieldsFromDraft(draft, imageResolution.imageUrl);
  const { uploadedPath, previousPathToDelete } = imageResolution;

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update(fields)
      .eq('id', trimmedId)
      .eq('business_id', owner.businessId)
      .select(MENU_ITEM_SELECT)
      .single();

    if (error) {
      logDevError('updateOwnerMenuItem', error);
      if (uploadedPath) {
        await deleteUploadedMenuImage(uploadedPath);
      }
      const code: MenuItemErrorCode = isNetworkError(error) ? 'network' : 'update_failed';
      return {
        ok: false,
        code,
        message: userFacingError(code),
      };
    }

    if (previousPathToDelete) {
      await deleteUploadedMenuImage(previousPathToDelete);
    }

    const item = menuItemRowToBusinessMenuItem(data as MenuItemRow);
    return { ok: true, item };
  } catch (error) {
    logDevError('updateOwnerMenuItem', error);
    if (uploadedPath) {
      await deleteUploadedMenuImage(uploadedPath);
    }
    const code: MenuItemErrorCode = isNetworkError(error) ? 'network' : 'update_failed';
    return {
      ok: false,
      code,
      message: userFacingError(code),
    };
  }
}

export async function deleteOwnerMenuItem(menuItemId: string): Promise<MutateOwnerMenuItemResult> {
  const trimmedId = menuItemId.trim();
  if (!trimmedId) {
    return { ok: false, code: 'not_found', message: userFacingError('not_found') };
  }

  const owner = await requireVerifiedOwnerMenuAccess();
  if (!owner.ok) {
    return owner;
  }

  try {
    const existing = await getOwnerMenuItemById(trimmedId);
    if (!existing.ok) {
      return existing;
    }

    const imagePath = extractMenuImageStoragePath(existing.item.imageUrl);

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', trimmedId)
      .eq('business_id', owner.businessId);

    if (error) {
      logDevError('deleteOwnerMenuItem', error);
      return {
        ok: false,
        code: isNetworkError(error) ? 'network' : 'delete_failed',
        message: userFacingError('delete_failed'),
      };
    }

    if (imagePath) {
      await deleteUploadedMenuImage(imagePath);
    }

    return { ok: true };
  } catch (error) {
    logDevError('deleteOwnerMenuItem', error);
    return {
      ok: false,
      code: isNetworkError(error) ? 'network' : 'delete_failed',
      message: userFacingError('delete_failed'),
    };
  }
}
