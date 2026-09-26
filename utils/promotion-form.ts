import {
  EMPTY_PROMOTION_DRAFT,
  type PromotionDraft,
  type PromotionFormErrors,
  type PromotionStatusLabel,
} from '@/types/promotion-draft';
import { PROMOTION_FIELD_LIMITS } from '@/constants/promotion-create';
import {
  combineDateAndTime,
  formatDisplayDate,
  formatDisplayTime,
  parseIsoDate,
  startOfDay,
} from '@/utils/date-time';

let draft: PromotionDraft | null = null;

let editingPromotionId: string | null = null;
let originalPromotionImageUrl: string | null = null;

export type PromotionEditSession = {
  promotionId: string;
  originalImageUrl: string | null;
};

export function beginPromotionEdit(promotionId: string, draftValues: PromotionDraft, imageUrl: string | null) {
  editingPromotionId = promotionId;
  originalPromotionImageUrl = imageUrl;
  draft = draftValues;
}

export function getPromotionEditSession(): PromotionEditSession | null {
  if (!editingPromotionId) {
    return null;
  }

  return {
    promotionId: editingPromotionId,
    originalImageUrl: originalPromotionImageUrl,
  };
}

export function clearPromotionEditSession() {
  editingPromotionId = null;
  originalPromotionImageUrl = null;
}

export function setPromotionDraft(next: PromotionDraft) {
  draft = next;
}

export function getPromotionDraft(): PromotionDraft | null {
  return draft;
}

export function clearPromotionDraft() {
  draft = null;
  clearPromotionEditSession();
}

export function formatPromotionDate(value: string | null): string {
  return formatDisplayDate(value);
}

export function getPromotionStartDateTime(
  form: Pick<PromotionDraft, 'startDate' | 'startTime'>,
): Date | null {
  return combineDateAndTime(form.startDate, form.startTime);
}

export function getPromotionEndDateTime(
  form: Pick<PromotionDraft, 'endDate' | 'endTime'>,
): Date | null {
  return combineDateAndTime(form.endDate, form.endTime);
}

export function formatPromotionScheduleLabel(form: PromotionDraft): string {
  const startDate = formatDisplayDate(form.startDate);
  const endDate = formatDisplayDate(form.endDate);
  const startTime = formatDisplayTime(form.startTime);
  const endTime = formatDisplayTime(form.endTime);

  if (form.startDate && form.endDate && form.startDate !== form.endDate) {
    return `${startDate} ${startTime} – ${endDate} ${endTime}`;
  }

  return `${startDate} · ${startTime} – ${endTime}`;
}

export function getPromotionStatus(form: PromotionDraft): PromotionStatusLabel {
  const startDateTime = getPromotionStartDateTime(form);
  const endDateTime = getPromotionEndDateTime(form);

  if (!startDateTime || !endDateTime) {
    return 'Starts Soon';
  }

  const now = Date.now();

  if (now < startDateTime.getTime()) {
    return 'Starts Soon';
  }

  if (now > endDateTime.getTime()) {
    return 'Expired';
  }

  return 'Active';
}

export function isPromotionFormEmpty(form: PromotionDraft): boolean {
  return (
    !form.imageUri &&
    !form.title.trim() &&
    !form.description.trim() &&
    !form.startDate &&
    !form.startTime &&
    !form.endDate &&
    !form.endTime &&
    !form.promotionCode.trim() &&
    !form.redemptionInstructions.trim() &&
    !form.termsAndConditions.trim()
  );
}

export function validatePromotionForm(form: PromotionDraft): {
  valid: boolean;
  errors: PromotionFormErrors;
} {
  const errors: PromotionFormErrors = {};

  if (!form.title.trim()) {
    errors.title = 'Promotion title is required.';
  } else if (form.title.length > PROMOTION_FIELD_LIMITS.title) {
    errors.title = `Maximum ${PROMOTION_FIELD_LIMITS.title} characters.`;
  }

  if (!form.description.trim()) {
    errors.description = 'Description is required.';
  } else if (form.description.length > PROMOTION_FIELD_LIMITS.description) {
    errors.description = `Maximum ${PROMOTION_FIELD_LIMITS.description} characters.`;
  }

  if (!form.startDate) {
    errors.startDate = 'Start date is required.';
  }

  if (!form.startTime) {
    errors.startTime = 'Start time is required.';
  }

  if (!form.endDate) {
    errors.endDate = 'End date is required.';
  }

  if (!form.endTime) {
    errors.endTime = 'End time is required.';
  }

  const startDate = parseIsoDate(form.startDate);
  const endDate = parseIsoDate(form.endDate);

  if (startDate && endDate && startOfDay(startDate) > startOfDay(endDate)) {
    errors.startDate = 'Start date cannot be after end date.';
    errors.endDate = 'End date cannot be before start date.';
  }

  const startDateTime = getPromotionStartDateTime(form);
  const endDateTime = getPromotionEndDateTime(form);

  if (startDateTime && endDateTime && endDateTime.getTime() < startDateTime.getTime()) {
    errors.endTime = 'End must be after start date and time.';
    if (!errors.startDate && !errors.endDate) {
      errors.startDate = 'Start must be before end date and time.';
    }
  }

  if (form.promotionCode.length > PROMOTION_FIELD_LIMITS.promotionCode) {
    errors.promotionCode = `Maximum ${PROMOTION_FIELD_LIMITS.promotionCode} characters.`;
  }

  if (form.redemptionInstructions.length > PROMOTION_FIELD_LIMITS.redemptionInstructions) {
    errors.redemptionInstructions = `Maximum ${PROMOTION_FIELD_LIMITS.redemptionInstructions} characters.`;
  }

  if (form.termsAndConditions.length > PROMOTION_FIELD_LIMITS.termsAndConditions) {
    errors.termsAndConditions = `Maximum ${PROMOTION_FIELD_LIMITS.termsAndConditions} characters.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function createEmptyPromotionDraft(): PromotionDraft {
  return { ...EMPTY_PROMOTION_DRAFT };
}
