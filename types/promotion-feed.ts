/** Consumer-facing promotion shown in feeds and saved items. */
export type PromotionFeedItem = {
  id: string;
  businessId: string;
  businessName: string;
  businessLogo: string;
  promotionImage: string;
  title: string;
  description: string;
  distanceLabel: string;
  distanceMiles: number;
  scheduleLabel: string;
  expiresLabel: string;
  verified: boolean;
  startAt: string;
  endAt: string;
  promotionCode?: string;
  redemptionInstructions?: string;
  termsAndConditions?: string;
};
