import type { PromotionRow } from '@/types/supabase-promotion';

export type OwnerPromotionLifecycle = 'active' | 'scheduled' | 'ended';

export type OwnerPromotionLifecycleLabel = 'Active' | 'Scheduled' | 'Ended';

export function getOwnerPromotionLifecycle(
  row: Pick<PromotionRow, 'status' | 'start_at' | 'end_at'>,
  now = new Date(),
): OwnerPromotionLifecycle {
  const nowMs = now.getTime();
  const startMs = new Date(row.start_at).getTime();
  const endMs = new Date(row.end_at).getTime();

  if (row.status === 'archived' || (!Number.isNaN(endMs) && endMs < nowMs)) {
    return 'ended';
  }

  if (row.status === 'published' && !Number.isNaN(startMs) && startMs > nowMs) {
    return 'scheduled';
  }

  if (
    row.status === 'published' &&
    !Number.isNaN(startMs) &&
    !Number.isNaN(endMs) &&
    startMs <= nowMs &&
    endMs >= nowMs
  ) {
    return 'active';
  }

  return 'ended';
}

export function ownerPromotionLifecycleLabel(
  lifecycle: OwnerPromotionLifecycle,
): OwnerPromotionLifecycleLabel {
  switch (lifecycle) {
    case 'active':
      return 'Active';
    case 'scheduled':
      return 'Scheduled';
    default:
      return 'Ended';
  }
}
