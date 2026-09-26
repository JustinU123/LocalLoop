import type { PromotionStatus } from '@/types/supabase-promotion';
import { formatPromotionExpiresLabel } from '@/utils/promotion-display';
import { getOwnerPromotionLifecycle } from '@/utils/promotion-owner';
import { formatScheduledPromotionLiveLabel } from '@/utils/promotion-scheduled-live-label';

export type DashboardPulsePromotionInput = {
  title: string;
  startAt: string;
  endAt: string;
  status: PromotionStatus;
};

export type DashboardPulsePromotionLine = {
  primary: string;
  secondary: string;
  mode: 'active' | 'scheduled';
};

function lifecycleAt(
  promotion: DashboardPulsePromotionInput,
  now: Date,
): ReturnType<typeof getOwnerPromotionLifecycle> {
  return getOwnerPromotionLifecycle(
    {
      status: promotion.status,
      start_at: promotion.startAt,
      end_at: promotion.endAt,
    },
    now,
  );
}

/**
 * Business Pulse promotion row copy. Active promotions take priority over scheduled.
 */
export function buildDashboardPulsePromotionLine(params: {
  promotions: DashboardPulsePromotionInput[];
  now: Date;
  failed: boolean;
}): DashboardPulsePromotionLine | null {
  if (params.failed) {
    return null;
  }

  const active = params.promotions.filter((promotion) => lifecycleAt(promotion, params.now) === 'active');

  if (active.length > 0) {
    const count = active.length;
    const primary = count === 1 ? '1 promotion active' : `${count} promotions active`;
    const featured = [...active].sort((a, b) => a.endAt.localeCompare(b.endAt))[0];
    const expires = formatPromotionExpiresLabel(featured.endAt, params.now);
    const secondary = expires ? `${featured.title} · ${expires}` : featured.title;
    return { primary, secondary, mode: 'active' };
  }

  const scheduled = params.promotions
    .filter((promotion) => lifecycleAt(promotion, params.now) === 'scheduled')
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  if (scheduled.length === 0) {
    return null;
  }

  const count = scheduled.length;
  const primary = count === 1 ? '1 promotion scheduled' : `${count} promotions scheduled`;
  const featured = scheduled[0];
  const liveLabel = formatScheduledPromotionLiveLabel(featured.startAt, params.now);
  const secondary = liveLabel ? `${featured.title} · ${liveLabel}` : featured.title;
  return { primary, secondary, mode: 'scheduled' };
}
