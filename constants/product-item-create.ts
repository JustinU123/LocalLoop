import type { AvailabilityStatus, DietaryTag, ProductItemType, PurchaseMethod } from '@/types/product-item-draft';

export const PRODUCT_ITEM_FIELD_LIMITS = {
  name: 80,
  description: 500,
  additionalInformation: 300,
  productDetail: 150,
  maxVariations: 5,
} as const;

export const PRODUCT_ITEM_PUBLISH_MESSAGE =
  'Product and menu item publishing will be connected to LocalLoop next.';

export const ITEM_TYPE_OPTIONS: { id: ProductItemType; label: string }[] = [
  { id: 'menu-item', label: 'Menu Item' },
  { id: 'product', label: 'Product' },
];

export const MENU_ITEM_CATEGORIES = [
  'Coffee',
  'Tea',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Bakery',
  'Appetizer',
  'Entrée',
  'Side',
  'Beverage',
  'Alcohol',
  'Other',
] as const;

export const PRODUCT_CATEGORIES = [
  'Clothing',
  'Accessories',
  'Beauty',
  'Home',
  'Art',
  'Books',
  'Food Product',
  'Jewelry',
  'Gifts',
  'Other',
] as const;

export const AVAILABILITY_OPTIONS: { id: AvailabilityStatus; label: string }[] = [
  { id: 'available-now', label: 'Available Now' },
  { id: 'coming-soon', label: 'Coming Soon' },
  { id: 'limited-availability', label: 'Limited Availability' },
  { id: 'sold-out', label: 'Sold Out' },
];

export const PURCHASE_METHOD_OPTIONS: { id: PurchaseMethod; label: string }[] = [
  { id: 'in-store', label: 'In Store' },
  { id: 'pickup', label: 'Pickup' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'order-online', label: 'Order Online' },
];

export const DIETARY_TAG_OPTIONS: { id: DietaryTag; label: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'dairy-free', label: 'Dairy-Free' },
  { id: 'nut-free', label: 'Nut-Free' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
  { id: 'spicy', label: 'Spicy' },
];

export const DIETARY_ALLERGEN_NOTE =
  'Customers should confirm allergy information directly with the business.';

export const ITEM_NAME_PLACEHOLDERS: Record<ProductItemType, string> = {
  product: 'Limited Edition Hoodie',
  'menu-item': 'Strawberry Matcha',
};

export const ITEM_DESCRIPTION_PLACEHOLDERS: Record<ProductItemType, string> = {
  product: 'Heavyweight cotton hoodie featuring our summer design.',
  'menu-item': 'Ceremonial matcha with strawberry cold foam.',
};
