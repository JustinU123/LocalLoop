import type { BusinessProfileForm, BusinessProfileFormErrors } from '@/types/business-profile-form';
import { EMPTY_BUSINESS_PROFILE_FORM } from '@/types/business-profile-form';
import type { BusinessRow } from '@/types/supabase-business';
import { isValidEmail, isValidUrl } from '@/utils/date-time';

function normalizePart(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function businessRowToProfileForm(row: BusinessRow): BusinessProfileForm {
  return {
    name: row.name?.trim() ?? '',
    category: row.category?.trim() ?? '',
    description: row.description?.trim() ?? '',
    streetAddress: row.street_address?.trim() ?? '',
    city: row.city?.trim() ?? '',
    state: row.state?.trim() ?? '',
    postalCode: row.postal_code?.trim() ?? '',
    phone: row.phone?.trim() ?? '',
    email: row.email?.trim() ?? '',
    website: row.website?.trim() ?? '',
    instagram: row.instagram?.trim() ?? '',
  };
}

export function buildAddressFingerprint(form: BusinessProfileForm): string {
  return [
    normalizePart(form.streetAddress),
    normalizePart(form.city),
    normalizePart(form.state),
    normalizePart(form.postalCode),
  ]
    .join('|')
    .toLowerCase();
}

export function buildAddressFingerprintFromRow(row: BusinessRow): string {
  return buildAddressFingerprint(businessRowToProfileForm(row));
}

export function buildGeocodeQuery(form: BusinessProfileForm): string {
  return [
    normalizePart(form.streetAddress),
    normalizePart(form.city),
    normalizePart(form.state),
    normalizePart(form.postalCode),
  ]
    .filter(Boolean)
    .join(', ');
}

export function validateBusinessProfileForm(form: BusinessProfileForm): {
  valid: boolean;
  errors: BusinessProfileFormErrors;
  message: string | null;
} {
  const errors: BusinessProfileFormErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Business name is required.';
  }

  if (!form.category.trim()) {
    errors.category = 'Business category is required.';
  }

  if (!form.description.trim()) {
    errors.description = 'Business description is required.';
  }

  if (!form.streetAddress.trim()) {
    errors.streetAddress = 'Street address is required.';
  }

  if (!form.city.trim()) {
    errors.city = 'City is required.';
  }

  if (!form.state.trim()) {
    errors.state = 'State is required.';
  }

  if (!form.postalCode.trim()) {
    errors.postalCode = 'ZIP code is required.';
  }

  if (form.email.trim() && !isValidEmail(form.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (form.website.trim() && !isValidUrl(form.website)) {
    errors.website = 'Enter a valid website URL.';
  }

  const firstError = Object.values(errors)[0] ?? null;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    message: firstError,
  };
}

export function createEmptyBusinessProfileForm(): BusinessProfileForm {
  return { ...EMPTY_BUSINESS_PROFILE_FORM };
}

export function mergeProfileFormPatch(
  row: BusinessRow,
  patch: Partial<BusinessProfileForm>,
): BusinessProfileForm {
  return {
    ...businessRowToProfileForm(row),
    ...patch,
  };
}

function firstValidationMessage(errors: BusinessProfileFormErrors): string | null {
  return Object.values(errors)[0] ?? null;
}

export function validateBusinessInformationSection(
  fields: Pick<BusinessProfileForm, 'name' | 'category' | 'description'>,
): {
  valid: boolean;
  errors: BusinessProfileFormErrors;
  message: string | null;
} {
  const errors: BusinessProfileFormErrors = {};

  if (!fields.name.trim()) {
    errors.name = 'Business name is required.';
  }

  if (!fields.category.trim()) {
    errors.category = 'Business category is required.';
  }

  if (!fields.description.trim()) {
    errors.description = 'Business description is required.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    message: firstValidationMessage(errors),
  };
}

export function validateContactLinksSection(
  fields: Pick<BusinessProfileForm, 'phone' | 'email' | 'website' | 'instagram'>,
): {
  valid: boolean;
  errors: BusinessProfileFormErrors;
  message: string | null;
} {
  const errors: BusinessProfileFormErrors = {};

  if (fields.email.trim() && !isValidEmail(fields.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (fields.website.trim() && !isValidUrl(fields.website)) {
    errors.website = 'Enter a valid website URL.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    message: firstValidationMessage(errors),
  };
}

export function validateLocationSection(
  fields: Pick<
    BusinessProfileForm,
    'streetAddress' | 'city' | 'state' | 'postalCode'
  >,
): {
  valid: boolean;
  errors: BusinessProfileFormErrors;
  message: string | null;
} {
  const errors: BusinessProfileFormErrors = {};

  if (!fields.streetAddress.trim()) {
    errors.streetAddress = 'Street address is required.';
  }

  if (!fields.city.trim()) {
    errors.city = 'City is required.';
  }

  if (!fields.state.trim()) {
    errors.state = 'State is required.';
  }

  if (!fields.postalCode.trim()) {
    errors.postalCode = 'ZIP code is required.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    message: firstValidationMessage(errors),
  };
}
