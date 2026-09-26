/**
 * Run: npx tsx scripts/run-post-comment-display-tests.ts
 */

import { formatCommentAuthorDisplayName } from '../utils/post-comment-display';
import { formatEngagementCount } from '../utils/format-engagement-count';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  assert(
    formatCommentAuthorDisplayName('Justin', 'abc-123') === 'Justin',
    'uses display name when present',
  );
  assert(
    formatCommentAuthorDisplayName('  ', 'abcdef12-0000') === 'Member abcdef',
    'falls back to member prefix',
  );
  assert(formatEngagementCount(999) === '999', 'engagement count under 1k');
  assert(formatEngagementCount(1247) === '1.2K', 'engagement count compact');

  console.log('post-comment-display: all checks passed');
}

run();
