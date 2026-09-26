/**
 * Run: npx tsx scripts/run-promotion-scheduled-live-label-tests.ts
 */

import { formatScheduledPromotionLiveLabel } from '../utils/promotion-scheduled-live-label';

type Case = {
  name: string;
  startAtIso: string;
  now: Date;
  expected: string | null;
};

function assertEqual(actual: string | null, expected: string | null, name: string) {
  if (actual !== expected) {
    throw new Error(`[${name}] expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const fixedNow = new Date('2026-09-23T18:00:00.000Z');

const cases: Case[] = [
  {
    name: '1 minute',
    startAtIso: new Date(fixedNow.getTime() + 60_000).toISOString(),
    now: fixedNow,
    expected: 'Live in 1 min',
  },
  {
    name: '4 minutes',
    startAtIso: new Date(fixedNow.getTime() + 4 * 60_000).toISOString(),
    now: fixedNow,
    expected: 'Live in 4 min',
  },
  {
    name: '45 minutes',
    startAtIso: new Date(fixedNow.getTime() + 45 * 60_000).toISOString(),
    now: fixedNow,
    expected: 'Live in 45 min',
  },
  {
    name: '2 hours same local day',
    startAtIso: new Date(fixedNow.getTime() + 2 * 60 * 60_000).toISOString(),
    now: fixedNow,
    expected: 'Live in 2 hr',
  },
  {
    name: '6 hours same local day',
    startAtIso: new Date(fixedNow.getTime() + 6 * 60 * 60_000).toISOString(),
    now: fixedNow,
    expected: 'Live in 6 hr',
  },
  {
    name: 'start already reached',
    startAtIso: new Date(fixedNow.getTime() - 1_000).toISOString(),
    now: fixedNow,
    expected: null,
  },
  {
    name: 'invalid timestamp',
    startAtIso: 'not-a-date',
    now: fixedNow,
    expected: null,
  },
  {
    name: 'empty timestamp',
    startAtIso: '   ',
    now: fixedNow,
    expected: null,
  },
];

function runTomorrowCase() {
  const now = new Date('2026-09-23T10:00:00');
  const start = new Date('2026-09-24T09:00:00');
  const label = formatScheduledPromotionLiveLabel(start.toISOString(), now);
  const expectedTime = start.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  assertEqual(label, `Live tomorrow at ${expectedTime}`, 'tomorrow at 9 AM');
}

function runLaterDateCase() {
  const now = new Date('2026-09-23T10:00:00');
  const start = new Date('2026-09-28T14:00:00');
  const label = formatScheduledPromotionLiveLabel(start.toISOString(), now);
  const monthDay = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const expectedTime = start.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  assertEqual(label, `Live ${monthDay} at ${expectedTime}`, 'later calendar date');
}

for (const testCase of cases) {
  const actual = formatScheduledPromotionLiveLabel(testCase.startAtIso, testCase.now);
  assertEqual(actual, testCase.expected, testCase.name);
}

runTomorrowCase();
runLaterDateCase();

console.log(`All ${cases.length + 2} promotion scheduled live label tests passed.`);
