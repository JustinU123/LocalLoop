import {
  EMPTY_PROMOTION_DRAFT,
  type PromotionDraft,
  type PromotionFormErrors,
  type PromotionStatusLabel,
} from '@/types/promotion-draft';
import { PROMOTION_FIELD_LIMITS } from '@/constants/promotion-create';

let draft: PromotionDraft | null = null;

export function setPromotionDraft(next: PromotionDraft) {
  draft = next;
}

export function getPromotionDraft(): PromotionDraft | null {
  return draft;
}

export function clearPromotionDraft() {
  draft = null;
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function parsePromotionDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function serializePromotionDate(date: Date): string {
  return startOfDay(date).toISOString();
}

export function formatPromotionDate(value: string | null): string {
  const parsed = parsePromotionDate(value);
  if (!parsed) {
    return 'Select date';
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getPromotionStatus(
  startDate: string | null,
  endDate: string | null,
): PromotionStatusLabel {
  const start = parsePromotionDate(startDate);
  const end = parsePromotionDate(endDate);
  if (!start || !end) {
    return 'Starts Soon';
  }

  const today = startOfDay(new Date());
  const startDay = startOfDay(start);
  const endDay = startOfDay(end);

  if (today < startDay) {
    return 'Starts Soon';
  }

  if (today > endDay) {
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
    !form.endDate &&
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

  if (!form.endDate) {
    errors.endDate = 'End date is required.';
  }

  const start = parsePromotionDate(form.startDate);
  const end = parsePromotionDate(form.endDate);

  if (start && end && startOfDay(start) > startOfDay(end)) {
    errors.startDate = 'Start date cannot be after end date.';
    errors.endDate = 'End date cannot be before start date.';
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
