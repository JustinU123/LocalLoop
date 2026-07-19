import type { AnnouncementCategory } from '@/types/announcement-draft';

export const ANNOUNCEMENT_FIELD_LIMITS = {
  title: 80,
  message: 600,
} as const;

export const ANNOUNCEMENT_PUBLISH_MESSAGE =
  'Announcement publishing will be connected to LocalLoop next.';

export const ANNOUNCEMENT_CATEGORY_OPTIONS: { id: AnnouncementCategory; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'holiday-hours', label: 'Holiday Hours' },
  { id: 'temporary-closure', label: 'Temporary Closure' },
  { id: 'new-hours', label: 'New Hours' },
  { id: 'hiring', label: 'Hiring' },
  { id: 'important-update', label: 'Important Update' },
  { id: 'thank-you', label: 'Thank You' },
  { id: 'community', label: 'Community' },
  { id: 'other', label: 'Other' },
];
