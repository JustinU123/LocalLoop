/**
 * Run: npx tsx scripts/run-business-dashboard-pulse-promotion-tests.ts
 */

import { buildDashboardPulsePromotionLine } from '../utils/business-dashboard-pulse-promotion';

function assertEqual<T>(actual: T, expected: T, name: string) {
  if (actual !== expected) {
    throw new Error(`[${name}] expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const now = new Date('2026-09-23T18:00:00.000Z');

const activePromo = {
  title: 'Fall Drinks Special',
  status: 'published' as const,
  startAt: new Date(now.getTime() - 60 * 60_000).toISOString(),
  endAt: new Date(now.getTime() + 43 * 60_000).toISOString(),
};

const scheduledPromo = {
  title: 'BOGO Coffee',
  status: 'published' as const,
  startAt: new Date(now.getTime() + 12 * 60_000).toISOString(),
  endAt: new Date(now.getTime() + 7 * 24 * 60 * 60_000).toISOString(),
};

assertEqual(buildDashboardPulsePromotionLine({ promotions: [], now, failed: true }), null, 'failed');

const activeLine = buildDashboardPulsePromotionLine({
  promotions: [activePromo],
  now,
  failed: false,
});
assertEqual(activeLine?.primary, '1 promotion active', 'active primary');
assertEqual(
  activeLine?.secondary,
  'Fall Drinks Special · Ends in 43 min',
  'active secondary',
);

const scheduledLine = buildDashboardPulsePromotionLine({
  promotions: [scheduledPromo],
  now,
  failed: false,
});
assertEqual(scheduledLine?.primary, '1 promotion scheduled', 'scheduled primary');
assertEqual(scheduledLine?.secondary, 'BOGO Coffee · Live in 12 min', 'scheduled secondary');

const priorityLine = buildDashboardPulsePromotionLine({
  promotions: [scheduledPromo, activePromo],
  now,
  failed: false,
});
assertEqual(priorityLine?.mode, 'active', 'active over scheduled');
assertEqual(priorityLine?.primary, '1 promotion active', 'priority primary');

const ended = {
  title: 'Old Promo',
  status: 'published' as const,
  startAt: new Date(now.getTime() - 48 * 60 * 60_000).toISOString(),
  endAt: new Date(now.getTime() - 60_000).toISOString(),
};

assertEqual(
  buildDashboardPulsePromotionLine({ promotions: [ended], now, failed: false }),
  null,
  'ended excluded',
);

console.log('All business dashboard pulse promotion tests passed.');
