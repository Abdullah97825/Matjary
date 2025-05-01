import { Product } from '@prisma/client';
import { convertPrice } from './cart';
import { CartProduct, SerializedCartProduct } from '@/types/cart';
import { ProductThumbnail } from '@/types/products';

export function calculateDiscountedPrice(
  product: SerializedCartProduct | Product | CartProduct | ProductThumbnail
): number {
  const originalPrice = typeof product.price === 'number' 
    ? product.price 
    : convertPrice(product.price);
  
  if (!product.discountType) return originalPrice;
  
  let finalPrice = originalPrice;
  
  if (product.discountType === 'FLAT' || product.discountType === 'BOTH') {
    const discountAmount = product.discountAmount 
      ? (typeof product.discountAmount === 'number' 
        ? product.discountAmount 
        : convertPrice(product.discountAmount))
      : 0;
    finalPrice -= discountAmount;
  }
  
  if (product.discountType === 'PERCENTAGE' || product.discountType === 'BOTH') {
    const percentageDiscount = (product.discountPercent || 0) / 100;
    finalPrice = finalPrice * (1 - percentageDiscount);
  }
  
  return Math.max(0, finalPrice);
}

export function getDiscountLabel(product: ProductThumbnail | Product | CartProduct): string | null {
  if (!product.discountType) return null;
  
  const labels = [];
  
  if (product.discountType === 'FLAT' || product.discountType === 'BOTH') {
    labels.push(`-$${product.discountAmount}`);
  }
  
  if (product.discountType === 'PERCENTAGE' || product.discountType === 'BOTH') {
    labels.push(`-${product.discountPercent}%`);
  }
  
  return labels.join(' & ');
}