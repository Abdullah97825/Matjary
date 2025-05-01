import { Cart, DiscountType, CartItem as PrismaCartItem, Product } from '@prisma/client';
import { ProductImageType } from '@/types/products';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Base product interface for cart
export interface CartProduct {
  id: string;
  name: string;
  price: Decimal | number;
  stock: number;
  images: ProductImageType[];
  thumbnailId: string | null;
  thumbnail: ProductImageType | null;
  discountType: DiscountType | null;
  discountAmount: Decimal | number | null;
  discountPercent: number | null;
  negotiablePrice?: boolean;
  hidePrice?: boolean;
  requiresApproval?: boolean;
}

// Serialized version with converted numbers
export interface SerializedCartProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  images: ProductImageType[];
  thumbnail: ProductImageType | null;
  thumbnailId: string | null;
  discountType: DiscountType | null;
  discountAmount: number | null;
  discountPercent: number | null;
  negotiablePrice?: boolean;
  hidePrice?: boolean;
  requiresApproval?: boolean;
}

export interface SerializedCartItem {
  id: string;
  quantity: number;
  product: SerializedCartProduct;
}

export type ProductWithDiscount = Product & {
  discountType: DiscountType | null
  discountAmount: Decimal | null
  discountPercent: number | null
}

export interface CartItemWithProduct extends PrismaCartItem {
  product: CartProduct;
}

export interface CartWithItems extends Cart {
  items: CartItemWithProduct[];
}

export interface CartData {
  items: CartItemWithProduct[];
  subtotal: number;
}

export interface UpdateCartItemData {
  cartItemId: string;
  quantity: number;
}

export interface AddToCartData {
  productId: string;
  quantity: number;
}

export interface CartResponse {
  items: CartItemWithProduct[];
  subtotal: number;
  message?: string;
  error?: string;
}