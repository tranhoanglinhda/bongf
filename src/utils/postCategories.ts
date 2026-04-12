import type { PostCategory } from '../types/models';

export const POST_CATEGORIES: Array<{ value: PostCategory; label: string }> = [
  { value: 'exercise', label: 'Exercise' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'experience', label: 'Motivation' },
];

export const POST_CATEGORY_FILTERS: Array<{ value: PostCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  ...POST_CATEGORIES,
];

export const DEFAULT_POST_CATEGORY: PostCategory = 'exercise';

export const getPostCategoryLabel = (value: PostCategory): string =>
  POST_CATEGORIES.find((item) => item.value === value)?.label ?? value;

export const isPostCategory = (value: string): value is PostCategory =>
  POST_CATEGORIES.some((item) => item.value === value);

export const normalizePostCategory = (value: string | null | undefined): PostCategory =>
  isPostCategory(value ?? '') ? (value as PostCategory) : DEFAULT_POST_CATEGORY;
