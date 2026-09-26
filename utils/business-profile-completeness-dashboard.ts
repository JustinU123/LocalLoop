export type ProfileCompletenessDashboardSection =
  | 'progress'
  | 'celebration'
  | 'hidden'
  | 'celebration-meta-loading';

export type ResolveProfileCompletenessDashboardSectionInput = {
  percentage: number;
  /** undefined when the durable acknowledgement has not been loaded yet. */
  profileCompletionCelebratedAt: string | null | undefined;
  /** Keeps celebration visible until Dashboard loses focus after acknowledgement is persisted. */
  celebrationPinnedForFocusedVisit: boolean;
};

/**
 * Decides which profile-completeness block to show on the Business Dashboard.
 * Does not compute completeness percentage.
 */
export function resolveProfileCompletenessDashboardSection(
  input: ResolveProfileCompletenessDashboardSectionInput,
): ProfileCompletenessDashboardSection {
  const { percentage, profileCompletionCelebratedAt, celebrationPinnedForFocusedVisit } = input;

  if (percentage < 100) {
    return 'progress';
  }

  if (profileCompletionCelebratedAt === undefined) {
    return 'celebration-meta-loading';
  }

  if (profileCompletionCelebratedAt === null) {
    return 'celebration';
  }

  if (celebrationPinnedForFocusedVisit) {
    return 'celebration';
  }

  return 'hidden';
}
