export type FoursquareCategoryRef = {
  id?: string;
  fsq_category_id?: string;
  name?: string;
};

function categoryIdRaw(category: FoursquareCategoryRef): string | undefined {
  return category.fsq_category_id?.trim() || category.id?.trim();
}

/** Foursquare Places OS taxonomy — non-food chain locations we never surface. */
const DISALLOWED_NUMERIC_CATEGORY_IDS = new Set<number>([
  13385, // Dining and Drinking > Truck Stop
  19057, // Travel and Transportation > Truck Stop
  17069, // Grocery Store
  17070, // Organic Grocery
  17142, // Supermarket
  17144, // Market (retail)
  17145, // Pharmacy
]);

/** Bar / drink-only venues (prepared food chains still use Restaurant / Fast Food / Café). */
const DISALLOWED_DINING_NUMERIC_IDS = new Set<number>([
  13389, // Irish Pub
]);

const DISALLOWED_PRIMARY_NAME =
  /\b(supermarket|grocery\s*store|grocery|organic\s*grocery|convenience\s*store|pharmacy|drug\s*store|department\s*store|big\s*box|discount\s*store|warehouse\s*store|wholesale\s*store|electronics\s*store|music\s*store|record\s*(shop|store)|book\s*store|bookshop|clothing\s*store|apparel|shoe\s*store|sporting\s*goods|home\s*goods|furniture\s*store|hardware\s*store|home\s*improvement|pet\s*store|toy\s*store|fitness\s*center|gym\b|yoga\s*studio|pilates\s*studio|hotel\b|motel|resort|bank\b|atm\b|gas\s*station|fuel\s*station|truck\s*stop|car\s*wash|auto\s*parts|dealership|laundromat|dry\s*cleaner|salon\b|barber\s*shop|nail\s*salon|spa\b|tanning\b|real\s*estate|insurance|office\b|coworking)\b/i;

const ALLOWED_FOOD_DRINK_NAME =
  /\b(restaurant|fast\s*food|coffee\s*shop|caf[eé]|cafeteria|tea\s*room|bubble\s*tea|bakery|bakeries|dessert|donut|doughnut|ice\s*cream|frozen\s*yogurt|gelato|creperie|cupcake|waffle\s*shop|food\s*truck|juice\s*bar|smoothie|bagel|deli|bodega|burger|pizza|taco|burrito|sandwich|chicken\s*joint|hot\s*dog|diner|bbq|barbecue|steakhouse|sushi|ramen|noodle|wings?|seafood|steak\s*house|breakfast\s*spot|buffet|food\s*court|acai|hotpot|dim\s*sum|falafel|kebab|shawarma|empanada|mac\s*&?\s*cheese|snack\s*place|comfort\s*food|gastropub|brewpub)\b/i;

/**
 * Numeric IDs under Foursquare "Dining and Drinking" for prepared food & beverage
 * (cafés, restaurants, dessert, etc.). See Foursquare Places category taxonomy.
 */
function isAllowedNumericDiningCategoryId(id: number): boolean {
  if (DISALLOWED_NUMERIC_CATEGORY_IDS.has(id) || DISALLOWED_DINING_NUMERIC_IDS.has(id)) {
    return false;
  }

  if (id >= 13032 && id <= 13384) {
    return true;
  }

  if (id >= 13390 && id <= 13392) {
    return true;
  }

  return false;
}

function parseNumericCategoryId(rawId: string | undefined): number | null {
  const trimmed = rawId?.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function categoryName(category: FoursquareCategoryRef): string {
  return (category.name ?? "").trim();
}

function isDisallowedPrimaryCategory(category: FoursquareCategoryRef): boolean {
  const name = categoryName(category);
  const numericId = parseNumericCategoryId(categoryIdRaw(category));

  if (numericId != null && DISALLOWED_NUMERIC_CATEGORY_IDS.has(numericId)) {
    return true;
  }

  if (name && DISALLOWED_PRIMARY_NAME.test(name)) {
    return true;
  }

  return false;
}

function isAllowedFoodOrDrinkCategoryEntry(category: FoursquareCategoryRef): boolean {
  const name = categoryName(category);
  const numericId = parseNumericCategoryId(categoryIdRaw(category));

  if (numericId != null) {
    if (DISALLOWED_NUMERIC_CATEGORY_IDS.has(numericId)) {
      return false;
    }
    if (isAllowedNumericDiningCategoryId(numericId)) {
      return true;
    }
  }

  if (name && ALLOWED_FOOD_DRINK_NAME.test(name)) {
    return true;
  }

  return false;
}

export function pickAllowedFoodOrDrinkCategory(
  categories: FoursquareCategoryRef[] | undefined,
): FoursquareCategoryRef | null {
  const list = categories?.filter((c) => categoryName(c) || categoryIdRaw(c)) ?? [];
  if (list.length === 0) {
    return null;
  }

  if (isDisallowedPrimaryCategory(list[0])) {
    return null;
  }

  for (const category of list) {
    if (isAllowedFoodOrDrinkCategoryEntry(category)) {
      return category;
    }
  }

  return null;
}

export function isAllowedFoodOrDrinkCategory(
  categories: FoursquareCategoryRef[] | undefined,
): boolean {
  return pickAllowedFoodOrDrinkCategory(categories) != null;
}
