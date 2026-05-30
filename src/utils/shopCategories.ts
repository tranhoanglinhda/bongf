import type { LevelLabel, LinkCategory, MealType, ShopType } from '../types/models';

export interface ShopCategory {
  id: LinkCategory;
  label: string;
  icon: string;
}

export const SHOP_CATEGORIES: ShopCategory[] = [
  { id: 'apparel', label: 'Đồ tập & quần áo thể thao', icon: 'shirt' },
  { id: 'kitchen', label: 'Đồ gia dụng nhà bếp', icon: 'pot' },
  { id: 'spices', label: 'Gia vị & thực phẩm', icon: 'spice' },
  { id: 'skincare', label: 'Skincare & làm đẹp', icon: 'drop' },
  { id: 'supplement', label: 'Thực phẩm bổ sung', icon: 'pill' },
];

export const SHOP_TYPES: ShopType[] = ['shopee', 'amazon', 'lazada', 'tiktok'];

export const LEVEL_LABELS: LevelLabel[] = ['Dễ', 'Trung bình', 'Khó'];

export const MEAL_TYPES: MealType[] = ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Đồ uống'];

export const WORKOUT_FILTERS: Array<'Tất cả' | LevelLabel> = ['Tất cả', ...LEVEL_LABELS];

export const RECIPE_FILTERS: Array<'Tất cả' | MealType> = ['Tất cả', ...MEAL_TYPES];

export const getCategoryLabel = (id: LinkCategory): string =>
  SHOP_CATEGORIES.find((category) => category.id === id)?.label ?? id;

export const getCategoryIcon = (id: LinkCategory): string =>
  SHOP_CATEGORIES.find((category) => category.id === id)?.icon ?? 'bolt';

export const isLinkCategory = (value: string): value is LinkCategory =>
  SHOP_CATEGORIES.some((category) => category.id === value);

export const normalizeLinkCategory = (value: string | null | undefined): LinkCategory =>
  isLinkCategory(value ?? '') ? (value as LinkCategory) : 'apparel';

export const isShopType = (value: string): value is ShopType => SHOP_TYPES.includes(value as ShopType);

export const normalizeShopType = (value: string | null | undefined): ShopType =>
  isShopType(value ?? '') ? (value as ShopType) : 'shopee';
