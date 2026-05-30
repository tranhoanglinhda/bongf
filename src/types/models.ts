export type WorkoutLevel = 1 | 2 | 3;

export type LevelLabel = 'Dễ' | 'Trung bình' | 'Khó';

export type MealType = 'Bữa sáng' | 'Bữa trưa' | 'Bữa tối' | 'Đồ uống';

export type LinkCategory = 'apparel' | 'kitchen' | 'spices' | 'skincare' | 'supplement';

export type ShopType = 'shopee' | 'amazon' | 'lazada' | 'tiktok';

export interface WorkoutStep {
  name: string;
  note: string;
  val: string;
  unit: string;
}

export interface WorkoutItem {
  id: string;
  /** English display name shown as the kicker. */
  title: string;
  /** Vietnamese title shown as the main heading. */
  vi: string;
  cover: string;
  level: WorkoutLevel;
  levelLabel: LevelLabel;
  duration: number;
  kcal: number;
  focus: string;
  blurb: string;
  tags: string[];
  equipment: string[];
  steps: WorkoutStep[];
  createdAt: string;
}

export interface RecipeIngredient {
  name: string;
  amt: string;
}

export interface RecipeStep {
  name: string;
  note: string;
}

export interface RecipeItem {
  id: string;
  title: string;
  vi: string;
  cover: string;
  meal: MealType;
  time: number;
  servings: number;
  kcal: number;
  protein: string;
  blurb: string;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  createdAt: string;
}

export interface LinkItem {
  id: string;
  name: string;
  cat: LinkCategory;
  shop: ShopType;
  price: string;
  note: string;
  thumb: string;
  affiliateUrl: string;
  createdAt: string;
}

export interface WorkoutInput {
  title: string;
  vi: string;
  cover: string;
  level: WorkoutLevel;
  levelLabel: LevelLabel;
  duration: number;
  kcal: number;
  focus: string;
  blurb: string;
  tags: string[];
  equipment: string[];
  steps: WorkoutStep[];
}

export interface RecipeInput {
  title: string;
  vi: string;
  cover: string;
  meal: MealType;
  time: number;
  servings: number;
  kcal: number;
  protein: string;
  blurb: string;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface LinkInput {
  name: string;
  cat: LinkCategory;
  shop: ShopType;
  price: string;
  note: string;
  thumb: string;
  affiliateUrl: string;
}
