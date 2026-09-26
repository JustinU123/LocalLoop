/**
 * Run: npx tsx scripts/run-business-profile-completeness-dashboard-tests.ts
 */

import { resolveProfileCompletenessDashboardSection } from '../utils/business-profile-completeness-dashboard';

function assertEqual<T>(actual: T, expected: T, name: string) {
  if (actual !== expected) {
    throw new Error(`[${name}] expected ${String(expected)}, got ${String(actual)}`);
  }
}

const cases: {
  name: string;
  input: Parameters<typeof resolveProfileCompletenessDashboardSection>[0];
  expected: ReturnType<typeof resolveProfileCompletenessDashboardSection>;
}[] = [
  {
    name: 'below 100 shows progress',
    input: {
      percentage: 92,
      profileCompletionCelebratedAt: null,
      celebrationPinnedForFocusedVisit: false,
    },
    expected: 'progress',
  },
  {
    name: 'first time 100 with no acknowledgement',
    input: {
      percentage: 100,
      profileCompletionCelebratedAt: null,
      celebrationPinnedForFocusedVisit: false,
    },
    expected: 'celebration',
  },
  {
    name: '100 acknowledged and not pinned hides section',
    input: {
      percentage: 100,
      profileCompletionCelebratedAt: '2026-09-01T12:00:00.000Z',
      celebrationPinnedForFocusedVisit: false,
    },
    expected: 'hidden',
  },
  {
    name: '100 acknowledged but pinned still celebrates for focused visit',
    input: {
      percentage: 100,
      profileCompletionCelebratedAt: '2026-09-01T12:00:00.000Z',
      celebrationPinnedForFocusedVisit: true,
    },
    expected: 'celebration',
  },
  {
    name: 'dropped below 100 after celebration shows progress again',
    input: {
      percentage: 84,
      profileCompletionCelebratedAt: '2026-09-01T12:00:00.000Z',
      celebrationPinnedForFocusedVisit: false,
    },
    expected: 'progress',
  },
  {
    name: 'return to 100 after celebration does not celebrate again',
    input: {
      percentage: 100,
      profileCompletionCelebratedAt: '2026-09-01T12:00:00.000Z',
      celebrationPinnedForFocusedVisit: false,
    },
    expected: 'hidden',
  },
  {
    name: '100 before meta loaded waits',
    input: {
      percentage: 100,
      profileCompletionCelebratedAt: undefined,
      celebrationPinnedForFocusedVisit: false,
    },
    expected: 'celebration-meta-loading',
  },
];

for (const testCase of cases) {
  assertEqual(
    resolveProfileCompletenessDashboardSection(testCase.input),
    testCase.expected,
    testCase.name,
  );
}

console.log(`All ${cases.length} profile completeness dashboard section tests passed.`);
