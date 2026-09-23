/**
 * Pure validation tests for business branding image specs (no RN / Supabase).
 * Run: npx tsx scripts/run-business-branding-image-spec-tests.ts
 */

import {
  buildResizePlan,
  maxOutputBytesForKind,
  validateOutputByteSize,
  validateSourceByteSize,
} from '../utils/business-branding-image-spec';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  assert(maxOutputBytesForKind('logo') === 2 * 1024 * 1024, 'logo max bytes');
  assert(maxOutputBytesForKind('cover') === 5 * 1024 * 1024, 'cover max bytes');

  assert(validateSourceByteSize(1024) === null, 'small source ok');
  assert(validateSourceByteSize(26 * 1024 * 1024) !== null, 'oversized source rejected');

  assert(validateOutputByteSize(3 * 1024 * 1024, 'logo') !== null, 'logo output cap');
  assert(validateOutputByteSize(1024, 'logo') === null, 'logo output ok');

  const logoPlan = buildResizePlan('logo', 2000, 1000);
  assert(logoPlan.resizeWidth === 1024, 'logo resize width');
  assert(logoPlan.resizeHeight === 512, 'logo resize height');

  const coverPlan = buildResizePlan('cover', 4000, 2000);
  assert(coverPlan.resizeWidth === 2400, 'cover resize width');
  assert(coverPlan.resizeHeight === 1200, 'cover resize height');

  console.log('business-branding-image-spec: all tests passed');
}

run();
