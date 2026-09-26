import type { WeeklyBusinessHours } from '@/types/business-hours';
import { businessRowToProfileForm } from '@/utils/business-profile-form';
import { isBusinessHoursConfigured } from '@/utils/business-hours';
import type { BusinessRow } from '@/types/supabase-business';

/**
 * Profile completeness weights (fixed, documented).
 *
 * Core fields total 60% (6 × 10% each):
 * - name, category, description, full address, contact (phone OR email), geocoded location
 *
 * Enhancement fields total 40% (5 × 8% each):
 * - logo, cover, website, instagram, business hours configured
 *
 * Menu, posts, promotions, and events are intentionally excluded.
 */

export const PROFILE_COMPLETENESS_CORE_WEIGHT = 10;
export const PROFILE_COMPLETENESS_ENHANCEMENT_WEIGHT = 8;

export type ProfileCompletenessFieldId =
  | 'name'
  | 'category'
  | 'description'
  | 'address'
  | 'contact'
  | 'geolocation'
  | 'logo'
  | 'cover'
  | 'website'
  | 'instagram'
  | 'hours';

export type ProfileCompletenessMissingItem = {
  id: ProfileCompletenessFieldId;
  label: string;
  nextStep: string;
  route: string;
};

export type ProfileCompletenessResult = {
  percentage: number;
  missing: ProfileCompletenessMissingItem[];
  nextStep: string | null;
  nextStepRoute: string | null;
  /** Short CTA label for the first missing field (Dashboard button). */
  actionLabel: string | null;
};

export type ProfileCompletenessInput = {
  business: BusinessRow | null;
  logoUrl: string | null;
  coverUrl: string | null;
  weeklyHours: WeeklyBusinessHours | null;
  latitude: number | null;
  longitude: number | null;
};

const FIELD_PRIORITY: ProfileCompletenessFieldId[] = [
  'name',
  'category',
  'description',
  'address',
  'contact',
  'geolocation',
  'logo',
  'cover',
  'hours',
  'website',
  'instagram',
];

const FIELD_COPY: Record<
  ProfileCompletenessFieldId,
  { label: string; nextStep: string; actionLabel: string; route: string }
> = {
  name: {
    label: 'Business name',
    nextStep: 'Add your business name to complete your profile.',
    actionLabel: 'Add Business Name',
    route: '/business-edit-profile',
  },
  category: {
    label: 'Category',
    nextStep: 'Add a category so customers know what you offer.',
    actionLabel: 'Add Category',
    route: '/business-edit-profile',
  },
  description: {
    label: 'Description',
    nextStep: 'Add a short description of your business.',
    actionLabel: 'Add Description',
    route: '/business-edit-profile',
  },
  address: {
    label: 'Address',
    nextStep: 'Add your full business address.',
    actionLabel: 'Add Address',
    route: '/business-edit-profile',
  },
  contact: {
    label: 'Contact',
    nextStep: 'Add a phone number or email so customers can reach you.',
    actionLabel: 'Add Contact Info',
    route: '/business-edit-profile',
  },
  geolocation: {
    label: 'Map location',
    nextStep: 'Confirm your business location on the map.',
    actionLabel: 'Set Business Location',
    route: '/business-settings-profile-location',
  },
  logo: {
    label: 'Logo',
    nextStep: 'Add a logo so customers can recognize your business.',
    actionLabel: 'Add Business Logo',
    route: '/business-settings-photos',
  },
  cover: {
    label: 'Cover photo',
    nextStep: 'Add a cover photo to make your profile stand out.',
    actionLabel: 'Add Cover Photo',
    route: '/business-settings-photos',
  },
  hours: {
    label: 'Business hours',
    nextStep: 'Add your business hours so customers know when to visit.',
    actionLabel: 'Add Business Hours',
    route: '/business-settings-hours',
  },
  website: {
    label: 'Website',
    nextStep: 'Add your website link for more customer discovery.',
    actionLabel: 'Add Website',
    route: '/business-settings-profile-contact',
  },
  instagram: {
    label: 'Instagram',
    nextStep: 'Add your Instagram handle to connect with customers.',
    actionLabel: 'Add Instagram',
    route: '/business-settings-profile-contact',
  },
};

function hasFullAddress(form: ReturnType<typeof businessRowToProfileForm>): boolean {
  return (
    Boolean(form.streetAddress.trim()) &&
    Boolean(form.city.trim()) &&
    Boolean(form.state.trim()) &&
    Boolean(form.postalCode.trim())
  );
}

function hasContact(form: ReturnType<typeof businessRowToProfileForm>): boolean {
  return Boolean(form.phone.trim()) || Boolean(form.email.trim());
}

function hasGeolocation(latitude: number | null, longitude: number | null): boolean {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude)
  );
}

function isFieldComplete(
  id: ProfileCompletenessFieldId,
  form: ReturnType<typeof businessRowToProfileForm>,
  input: ProfileCompletenessInput,
): boolean {
  switch (id) {
    case 'name':
      return Boolean(form.name.trim());
    case 'category':
      return Boolean(form.category.trim());
    case 'description':
      return Boolean(form.description.trim());
    case 'address':
      return hasFullAddress(form);
    case 'contact':
      return hasContact(form);
    case 'geolocation':
      return hasGeolocation(input.latitude, input.longitude);
    case 'logo':
      return Boolean(input.logoUrl?.trim());
    case 'cover':
      return Boolean(input.coverUrl?.trim());
    case 'website':
      return Boolean(form.website.trim());
    case 'instagram':
      return Boolean(form.instagram.trim());
    case 'hours':
      return input.weeklyHours ? isBusinessHoursConfigured(input.weeklyHours) : false;
    default:
      return false;
  }
}

function weightForField(id: ProfileCompletenessFieldId): number {
  if (
    id === 'name' ||
    id === 'category' ||
    id === 'description' ||
    id === 'address' ||
    id === 'contact' ||
    id === 'geolocation'
  ) {
    return PROFILE_COMPLETENESS_CORE_WEIGHT;
  }
  return PROFILE_COMPLETENESS_ENHANCEMENT_WEIGHT;
}

export function computeProfileCompleteness(input: ProfileCompletenessInput): ProfileCompletenessResult {
  const form = input.business ? businessRowToProfileForm(input.business) : businessRowToProfileForm({
    id: '',
    owner_user_id: '',
    name: '',
    category: null,
    description: null,
    phone: null,
    email: null,
    instagram: null,
    website: null,
    street_address: null,
    city: null,
    state: null,
    postal_code: null,
    latitude: null,
    longitude: null,
    verification_status: 'not_submitted',
    verified_at: null,
    created_at: '',
    updated_at: '',
  });

  let earned = 0;
  const maxScore = FIELD_PRIORITY.reduce((sum, id) => sum + weightForField(id), 0);
  const missing: ProfileCompletenessMissingItem[] = [];

  for (const id of FIELD_PRIORITY) {
    const complete = isFieldComplete(id, form, input);
    const weight = weightForField(id);
    if (complete) {
      earned += weight;
    } else {
      const copy = FIELD_COPY[id];
      missing.push({
        id,
        label: copy.label,
        nextStep: copy.nextStep,
        route: copy.route,
      });
    }
  }

  const percentage = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0;
  const firstMissing = missing[0];

  const firstMissingId = firstMissing?.id;
  const firstCopy = firstMissingId ? FIELD_COPY[firstMissingId] : null;

  return {
    percentage,
    missing,
    nextStep: firstMissing?.nextStep ?? null,
    nextStepRoute: firstMissing?.route ?? null,
    actionLabel: firstCopy?.actionLabel ?? null,
  };
}
