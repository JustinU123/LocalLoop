/**
 * Run: npx tsx scripts/run-analytics-engagement-metrics-tests.ts
 */

import { engagementCountMetric } from '../utils/analytics-engagement-metrics';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  assert(engagementCountMetric({ loading: true, failed: false, value: 0 }).state === 'loading', 'loading');
  assert(
    engagementCountMetric({ loading: false, failed: true, value: 5 }).state === 'unavailable',
    'failed',
  );
  assert(
    engagementCountMetric({ loading: false, failed: false, value: 3 }).state === 'ready' &&
      engagementCountMetric({ loading: false, failed: false, value: 3 }).state === 'ready' &&
      (engagementCountMetric({ loading: false, failed: false, value: 3 }) as { value: number }).value ===
        3,
    'ready value',
  );
  assert(
    engagementCountMetric({ loading: false, failed: false, value: 0 }).state === 'ready',
    'zero is ready',
  );

  console.log('analytics-engagement-metrics: all checks passed');
}

run();
