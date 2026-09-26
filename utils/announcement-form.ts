import { ANNOUNCEMENT_CATEGORY_OPTIONS, ANNOUNCEMENT_FIELD_LIMITS } from '@/constants/announcement-create';
import type {
  AnnouncementCategory,
  AnnouncementDraft,
  AnnouncementFormErrors,
} from '@/types/announcement-draft';
import { EMPTY_ANNOUNCEMENT_DRAFT } from '@/types/announcement-draft';
import { formatDisplayDate, parseIsoDate, startOfDay, todayStart } from '@/utils/date-time';

let draft: AnnouncementDraft | null = null;

export function setAnnouncementDraft(next: AnnouncementDraft) {
  draft = next;
}

export function getAnnouncementDraft(): AnnouncementDraft | null {
  return draft;
}

export function clearAnnouncementDraft() {
  draft = null;
}

export function createEmptyAnnouncementDraft(): AnnouncementDraft {
  return { ...EMPTY_ANNOUNCEMENT_DRAFT };
}

export function buildAnnouncementCaption(title: string, message: string): string {
  return `${title.trim()}\n\n${message.trim()}`;
}

export function parseAnnouncementCaption(caption: string): { title: string; message: string } {
  const trimmed = caption.trim();
  const separatorIndex = trimmed.indexOf('\n\n');

  if (separatorIndex === -1) {
    return { title: '', message: trimmed };
  }

  return {
    title: trimmed.slice(0, separatorIndex).trim(),
    message: trimmed.slice(separatorIndex + 2).trim(),
  };
}

export function getAnnouncementCategoryLabel(category: AnnouncementCategory | ''): string {
  if (!category) {
    return 'Announcement';
  }

  return (
    ANNOUNCEMENT_CATEGORY_OPTIONS.find((option) => option.id === category)?.label ?? 'Announcement'
  );
}

export function isAnnouncementFormEmpty(form: AnnouncementDraft): boolean {
  return (
    !form.imageUri &&
    !form.title.trim() &&
    !form.message.trim() &&
    !form.category &&
    !form.isPinned &&
    !form.hasExpiration &&
    !form.startDate &&
    !form.endDate &&
    form.notifyFollowers
  );
}

export function validateAnnouncementForm(form: AnnouncementDraft): {
  valid: boolean;
  errors: AnnouncementFormErrors;
} {
  const errors: AnnouncementFormErrors = {};

  if (!form.title.trim()) {
    errors.title = 'Announcement title is required.';
  } else if (form.title.length > ANNOUNCEMENT_FIELD_LIMITS.title) {
    errors.title = `Maximum ${ANNOUNCEMENT_FIELD_LIMITS.title} characters.`;
  }

  if (!form.message.trim()) {
    errors.message = 'Announcement message is required.';
  } else if (form.message.length > ANNOUNCEMENT_FIELD_LIMITS.message) {
    errors.message = `Maximum ${ANNOUNCEMENT_FIELD_LIMITS.message} characters.`;
  }

  if (!form.category) {
    errors.category = 'Category is required.';
  }

  if (form.hasExpiration) {
    const today = todayStart();
    const startDate = parseIsoDate(form.startDate);
    const endDate = parseIsoDate(form.endDate);

    if (!form.startDate) {
      errors.startDate = 'Start date is required.';
    } else if (startDate && startOfDay(startDate) < today) {
      errors.startDate = 'Start date cannot be in the past.';
    }

    if (!form.endDate) {
      errors.endDate = 'End date is required.';
    } else if (startDate && endDate && startOfDay(endDate) < startOfDay(startDate)) {
      errors.endDate = 'End date cannot be before start date.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export { formatDisplayDate };
