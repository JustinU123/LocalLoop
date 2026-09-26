import type { BusinessEvent } from '@/types/supabase-event';
import type { EventStatusLabel } from '@/types/event-draft';
import { getEventStatus } from '@/utils/event-form';

export type OwnerEventManageSection = 'current' | 'upcoming' | 'ended';

export function getOwnerEventManageSection(event: BusinessEvent): OwnerEventManageSection {
  if (event.status === 'archived') {
    return 'ended';
  }

  const status = getEventStatus(event.draft);
  if (status === 'Ended') {
    return 'ended';
  }
  if (status === 'Upcoming') {
    return 'upcoming';
  }

  return 'current';
}

export function getOwnerEventStatusLabel(event: BusinessEvent): EventStatusLabel | 'Canceled' {
  if (event.status === 'archived') {
    return 'Canceled';
  }

  return getEventStatus(event.draft);
}

export function ownerEventManageSectionTitle(section: OwnerEventManageSection): string {
  switch (section) {
    case 'current':
      return 'Happening / Current';
    case 'upcoming':
      return 'Upcoming';
    default:
      return 'Ended';
  }
}
