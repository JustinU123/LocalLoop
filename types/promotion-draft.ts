export type PromotionDraft = {
  imageUri: string | null;
  title: string;
  description: string;
  startDate: string | null;
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
  promotionCode: string;
  redemptionInstructions: string;
  termsAndConditions: string;
};

export type PromotionStatusLabel = 'Starts Soon' | 'Active' | 'Expired';

export type PromotionFormErrors = Partial<
  Record<
    | 'title'
    | 'description'
    | 'startDate'
    | 'startTime'
    | 'endDate'
    | 'endTime'
    | 'promotionCode'
    | 'redemptionInstructions'
    | 'termsAndConditions',
    string
  >
>;

export const EMPTY_PROMOTION_DRAFT: PromotionDraft = {
  imageUri: null,
  title: '',
  description: '',
  startDate: null,
  startTime: null,
  endDate: null,
  endTime: null,
  promotionCode: '',
  redemptionInstructions: '',
  termsAndConditions: '',
};
