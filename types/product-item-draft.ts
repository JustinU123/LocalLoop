export type ProductItemType = 'product' | 'menu-item';
export type AvailabilityStatus = 'available-now' | 'coming-soon' | 'limited-availability' | 'sold-out';
export type PurchaseMethod = 'in-store' | 'pickup' | 'delivery' | 'order-online';
export type DietaryTag =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'halal'
  | 'kosher'
  | 'spicy';

export type ProductItemVariation = {
  id: string;
  name: string;
  values: string;
};

export type ProductItemDraft = {
  itemType: ProductItemType;
  imageUri: string | null;
  name: string;
  description: string;
  price: string;
  priceVaries: boolean;
  category: string;
  availabilityStatus: AvailabilityStatus;
  availableDate: string | null;
  quantityAvailable: string;
  isLimitedTime: boolean;
  limitedTimeStartDate: string | null;
  limitedTimeEndDate: string | null;
  variations: ProductItemVariation[];
  dietaryTags: DietaryTag[];
  brand: string;
  material: string;
  sizeInformation: string;
  purchaseMethods: PurchaseMethod[];
  productLink: string;
  deliveryNotes: string;
  additionalInformation: string;
};

export type ProductItemFormErrors = Partial<
  Record<
    | keyof ProductItemDraft
    | `variationName-${string}`
    | `variationValues-${string}`,
    string
  >
>;

export const EMPTY_PRODUCT_ITEM_DRAFT: ProductItemDraft = {
  itemType: 'menu-item',
  imageUri: null,
  name: '',
  description: '',
  price: '',
  priceVaries: false,
  category: '',
  availabilityStatus: 'available-now',
  availableDate: null,
  quantityAvailable: '',
  isLimitedTime: false,
  limitedTimeStartDate: null,
  limitedTimeEndDate: null,
  variations: [],
  dietaryTags: [],
  brand: '',
  material: '',
  sizeInformation: '',
  purchaseMethods: [],
  productLink: '',
  deliveryNotes: '',
  additionalInformation: '',
};
