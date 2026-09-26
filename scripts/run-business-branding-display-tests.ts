/**
 * Pure resolver tests for consumer branding URLs.
 * Run: npx tsx scripts/run-business-branding-display-tests.ts
 */

import {
  resolveBusinessCoverUrl,
  resolveBusinessLogoUrl,
} from '../utils/business-branding-display';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  assert(
    resolveBusinessLogoUrl({ logoUrl: ' https://x/logo.jpg ', legacyFallback: 'https://post' }) ===
      'https://x/logo.jpg',
    'logo prefers logo_url',
  );
  assert(
    resolveBusinessLogoUrl({ logoUrl: null, legacyFallback: 'https://post' }) === 'https://post',
    'logo legacy fallback',
  );
  assert(resolveBusinessLogoUrl({ logoUrl: null, legacyFallback: null }) === '', 'logo empty');

  assert(
    resolveBusinessCoverUrl({
      coverUrl: 'https://x/cover.jpg',
      logoUrl: 'https://x/logo.jpg',
      legacyFallback: 'https://post',
    }) === 'https://x/cover.jpg',
    'cover prefers cover_url',
  );
  assert(
    resolveBusinessCoverUrl({
      coverUrl: null,
      logoUrl: 'https://x/logo.jpg',
      legacyFallback: 'https://post',
    }) === 'https://x/logo.jpg',
    'cover falls back to logo',
  );
  assert(
    resolveBusinessCoverUrl({
      coverUrl: null,
      logoUrl: null,
      legacyFallback: 'https://post',
    }) === 'https://post',
    'cover legacy fallback',
  );

  console.log('business-branding-display: all tests passed');
}

run();
