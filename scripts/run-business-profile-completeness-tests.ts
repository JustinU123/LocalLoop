/**
 * Deterministic profile completeness checks.
 * Run: npx tsx scripts/run-business-profile-completeness-tests.ts
 */

import type { BusinessRow } from '../types/supabase-business';
import { createEmptyWeeklyBusinessHours, createDefaultOpenDayHours } from '../utils/business-hours';
import {
  computeProfileCompleteness,
  PROFILE_COMPLETENESS_CORE_WEIGHT,
  PROFILE_COMPLETENESS_ENHANCEMENT_WEIGHT,
} from '../utils/business-profile-completeness';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function baseRow(overrides: Partial<BusinessRow> = {}): BusinessRow {
  return {
    id: 'biz-1',
    owner_user_id: 'user-1',
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
    verification_status: 'verified',
    verified_at: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function run() {
  const empty = computeProfileCompleteness({
    business: baseRow(),
    logoUrl: null,
    coverUrl: null,
    weeklyHours: createEmptyWeeklyBusinessHours(),
    latitude: null,
    longitude: null,
  });
  assert(empty.percentage === 0, 'empty profile is 0%');
  assert(empty.nextStep !== null, 'empty profile has next step');
  assert(empty.missing.length === 11, 'empty profile lists all fields');

  const coreOnly = computeProfileCompleteness({
    business: baseRow({
      name: 'Test Cafe',
      category: 'Cafe',
      description: 'Great coffee',
      street_address: '1 Main St',
      city: 'Portland',
      state: 'OR',
      postal_code: '97201',
      phone: '5035550100',
      latitude: 45.5,
      longitude: -122.6,
    }),
    logoUrl: null,
    coverUrl: null,
    weeklyHours: createEmptyWeeklyBusinessHours(),
    latitude: 45.5,
    longitude: -122.6,
  });
  assert(coreOnly.percentage === 60, 'core-only profile is 60%');
  assert(coreOnly.missing[0]?.id === 'logo', 'next step after core is logo');
  assert(coreOnly.actionLabel === 'Add Business Logo', 'contextual action label for logo');

  const withBranding = computeProfileCompleteness({
    business: baseRow({
      name: 'Test Cafe',
      category: 'Cafe',
      description: 'Great coffee',
      street_address: '1 Main St',
      city: 'Portland',
      state: 'OR',
      postal_code: '97201',
      email: 'hello@test.com',
      latitude: 45.5,
      longitude: -122.6,
    }),
    logoUrl: 'https://cdn/logo.jpg',
    coverUrl: 'https://cdn/cover.jpg',
    weeklyHours: createEmptyWeeklyBusinessHours(),
    latitude: 45.5,
    longitude: -122.6,
  });
  assert(
    withBranding.percentage === 60 + 2 * PROFILE_COMPLETENESS_ENHANCEMENT_WEIGHT,
    'branding adds enhancement weight',
  );

  const hours = createEmptyWeeklyBusinessHours();
  hours.monday = createDefaultOpenDayHours('09:00', '17:00');

  const complete = computeProfileCompleteness({
    business: baseRow({
      name: 'Test Cafe',
      category: 'Cafe',
      description: 'Great coffee',
      street_address: '1 Main St',
      city: 'Portland',
      state: 'OR',
      postal_code: '97201',
      phone: '5035550100',
      website: 'https://test.com',
      instagram: '@test',
      latitude: 45.5,
      longitude: -122.6,
    }),
    logoUrl: 'https://cdn/logo.jpg',
    coverUrl: 'https://cdn/cover.jpg',
    weeklyHours: hours,
    latitude: 45.5,
    longitude: -122.6,
  });
  assert(complete.percentage === 100, 'fully complete profile is 100%');
  assert(complete.missing.length === 0, 'complete profile has no missing fields');
  assert(complete.nextStep === null, 'complete profile has no next step');
  assert(complete.actionLabel === null, 'complete profile has no action label');

  const emailOnlyContact = computeProfileCompleteness({
    business: baseRow({
      name: 'Test',
      category: 'Shop',
      description: 'Desc',
      street_address: '1 Main',
      city: 'A',
      state: 'OR',
      postal_code: '97201',
      email: 'a@b.com',
      latitude: 1,
      longitude: 2,
    }),
    logoUrl: null,
    coverUrl: null,
    weeklyHours: null,
    latitude: 1,
    longitude: 2,
  });
  assert(!emailOnlyContact.missing.some((m) => m.id === 'contact'), 'email satisfies contact');

  const phoneOnlyContact = computeProfileCompleteness({
    business: baseRow({
      name: 'Test',
      category: 'Shop',
      description: 'Desc',
      street_address: '1 Main',
      city: 'A',
      state: 'OR',
      postal_code: '97201',
      phone: '555',
      latitude: 1,
      longitude: 2,
    }),
    logoUrl: null,
    coverUrl: null,
    weeklyHours: null,
    latitude: 1,
    longitude: 2,
  });
  assert(!phoneOnlyContact.missing.some((m) => m.id === 'contact'), 'phone satisfies contact');

  assert(
    PROFILE_COMPLETENESS_CORE_WEIGHT * 6 + PROFILE_COMPLETENESS_ENHANCEMENT_WEIGHT * 5 === 100,
    'weights sum to 100',
  );

  console.log('business-profile-completeness: all tests passed');
}

run();
