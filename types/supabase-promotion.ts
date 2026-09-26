import type { PromotionDraft } from '@/types/promotion-draft';

export type PromotionStatus = 'draft' | 'published' | 'archived';

export type PromotionRow = {
  id: string;
  business_id: string;
  status: PromotionStatus;
  title: string;
  description: string;
  image_url: string | null;
  start_at: string;
  end_at: string;
  promotion_code: string | null;
  redemption_instructions: string | null;
  terms_and_conditions: string | null;
  created_at: string;
  updated_at: string;
};

/** Published promotion returned to the app after create/read. */
export type BusinessPromotion = {
  id: string;
  businessId: string;
  status: PromotionStatus;
  title: string;
  description: string;
  imageUrl: string | null;
  startAt: string;
  endAt: string;
  promotionCode: string | null;
  redemptionInstructions: string | null;
  termsAndConditions: string | null;
  createdAt: string;
  updatedAt: string;
  draft: PromotionDraft;
};
