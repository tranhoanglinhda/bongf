export interface PostItem {
  id: string;
  title: string;
  image: string;
  description: string;
  category: PostCategory;
  createdAt: string;
}

export type PostCategory = 'exercise' | 'nutrition' | 'experience';

export type ShopType = 'amazon' | 'shopee';

export interface ProductItem {
  id: string;
  name: string;
  image: string;
  affiliateUrl: string;
  shop: ShopType;
  createdAt: string;
}

export interface GiftItem {
  id: string;
  email: string;
  createdAt: string;
}

export interface PostInput {
  title: string;
  image: string;
  description: string;
  category: PostCategory;
}

export interface ProductInput {
  name: string;
  image: string;
  affiliateUrl: string;
  shop: ShopType;
}
