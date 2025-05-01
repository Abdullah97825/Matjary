import { Product, ProductAttachment } from '@prisma/client';

export interface ProductImageType {
  id: string;
  url: string;
  productId: string;
  isThumbnail?: boolean;
}

export interface ProductThumbnail {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  isFeatured: boolean;
  categoryId: string;
  brandId: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
  thumbnailId: string | null;
  thumbnail: ProductImageType | null;
  avgRating: number;
  totalReviews: number;
  discountType: 'FLAT' | 'PERCENTAGE' | 'BOTH' | 'NONE' | null;
  discountAmount: number | null;
  discountPercent: number | null;
  negotiablePrice?: boolean;
  hidePrice?: boolean;
  hideStock?: boolean;
  useStock?: boolean;
}

export interface ProductWithImages extends ProductThumbnail {
  images: ProductImageType[];
  tags: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }[];
  attachments: ProductAttachment[];
  public: boolean;
  isArchived?: boolean;
  brand?: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface SerializedProduct extends Omit<Product, 'price'> {
  price: number;
}

export interface ProductFormData {
  name: string;
  description: string | null;
  price: number;
  stock: number;
  categoryId: string;
  brandId?: string | null;
  images: string[];
  attachments: {
    url: string;
    name: string;
  }[];
  tags: string[];
  thumbnailId?: string;
  discountType?: 'FLAT' | 'PERCENTAGE' | 'BOTH' | null;
  discountAmount?: number | null;
  discountPercent?: number | null;
  public?: boolean;
  isFeatured?: boolean;
  negotiablePrice?: boolean;
  hidePrice?: boolean;
  hideStock?: boolean;
  useStock?: boolean;
  isArchived?: boolean;
}

export type ProductUpdateData = Partial<ProductFormData>;

export interface CategoryType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}