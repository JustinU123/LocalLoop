export type PromotionDraft = {
  imageUri: string | null;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
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
    | 'endDate'
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
  endDate: null,
  promotionCode: '',
  redemptionInstructions: '',
  termsAndConditions: '',
};
