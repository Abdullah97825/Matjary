import { Product, Category, Tag, ProductAttachment, Review, User, Brand } from '@prisma/client';
import { ProductThumbnail, ProductWithImages, CategoryType } from '@/types/products';
import { convertPrice } from './cart';
import { Decimal } from '@prisma/client/runtime/library';
import { BrandType } from "@/types/brand";

// Utility for safely converting dates to ISO strings
export const toISOString = (date: Date | string): string => {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return date;
};

// Utility for handling decimal values consistently
export const safeDecimalConvert = (
  value: Decimal | number | null | undefined
): number | null => {
  if (value === null || value === undefined) return null;

  if (typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber();
  }

  return typeof value === 'number' ? value : convertPrice(value);
};

// Serialize a category consistently
export const serializeCategory = (category: Category): CategoryType => ({
  ...category,
  createdAt: toISOString(category.createdAt),
  updatedAt: toISOString(category.updatedAt)
});

// Serialize tags consistently
export const serializeTags = (tags: Tag[]): any[] => {
  return tags.map(tag => ({
    ...tag,
    createdAt: toISOString(tag.createdAt),
    updatedAt: toISOString(tag.updatedAt)
  }));
};

// Prepare product thumbnail data consistently
export const getThumbnail = (product: any): any | null => {
  if (!product.images || product.images.length === 0) return null;

  return product.thumbnailId
    ? product.images.find((img: any) => img.id === product.thumbnailId) || product.images[0]
    : product.images[0];
};

// Mark images with isThumbnail property
export const prepareImages = (product: any): any[] => {
  if (!product.images) return [];

  return product.images.map((img: any) => ({
    ...img,
    isThumbnail: img.id === product.thumbnailId
  }));
};

// Serialize reviews if present
export const serializeReviews = (reviews: (Review & { user?: User })[]): any[] => {
  if (!reviews) return [];

  return reviews.map(review => ({
    ...review,
    createdAt: toISOString(review.createdAt),
    updatedAt: toISOString(review.updatedAt)
  }));
};

// Basic product serialization (product thumbnail)
export const serializeProduct = (product: Product & {
  images: any[];
  category: Category;
  brand?: Brand | null;
}): ProductThumbnail => ({
  ...product,
  price: safeDecimalConvert(product.price) || 0,
  avgRating: product.avgRating ? Number(product.avgRating) : 0,
  totalReviews: Number(product.totalReviews || 0),
  discountAmount: safeDecimalConvert(product.discountAmount),
  discountPercent: product.discountPercent !== null ? product.discountPercent : null,
  thumbnail: getThumbnail(product),
  createdAt: toISOString(product.createdAt),
  updatedAt: toISOString(product.updatedAt),
  category: serializeCategory(product.category),
  negotiablePrice: !!product.negotiablePrice,
  hidePrice: !!product.hidePrice
});

// Comprehensive product serialization with images, tags, etc.
export const serializeProductWithImages = (product: Product & {
  images: any[];
  category: Category;
  brand?: Brand | null;
  tags: Tag[];
  attachments: ProductAttachment[];
  reviews?: (Review & { user?: User })[];
}): ProductWithImages => {
  const serialized = {
    ...serializeProduct(product),
    images: prepareImages(product),
    tags: serializeTags(product.tags),
    attachments: product.attachments || [],
    public: !!product.public
  };

  return serialized;
};

// Batch serialize multiple products
export const serializeProducts = (products: (Product & {
  images: any[];
  category: Category;
})[]): ProductThumbnail[] => {
  return products.map(product => serializeProduct(product));
};

// Batch serialize multiple products with images
export const serializeProductsWithImages = (products: (Product & {
  images: any[];
  category: Category;
  tags: Tag[];
  attachments: ProductAttachment[];
})[]): ProductWithImages[] => {
  return products.map(product => serializeProductWithImages(product));
};

// Serialize a brand consistently
export const serializeBrand = (brand: Brand & { _count?: { products: number } }): BrandType => ({
  id: brand.id,
  name: brand.name,
  slug: brand.slug,
  description: brand.description,
  imageUrl: brand.imageUrl,
  active: brand.active,
  createdAt: brand.createdAt.toISOString(),
  updatedAt: brand.updatedAt.toISOString(),
  _count: brand._count ? { products: brand._count.products } : undefined
}); 