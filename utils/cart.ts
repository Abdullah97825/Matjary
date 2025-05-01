import { CartWithItems, CartItemWithProduct, SerializedCartItem } from '@/types/cart';
import { Prisma } from '@prisma/client';
import { CART_UPDATED_EVENT } from './events';
import { calculateDiscountedPrice } from './price';

export const convertPrice = (price: number | Prisma.Decimal): number => {
  return typeof price === 'object' && 'toNumber' in price
    ? price.toNumber()
    : Number(price);
};

export const serializeCartData = (cart: CartWithItems | null) => {
  if (!cart) return { serializedItems: [], subtotal: 0 };

  const serializedItems: SerializedCartItem[] = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: convertPrice(item.product.price),
      stock: item.product.stock,
      images: item.product.images,
      thumbnail: item.product.thumbnail,
      thumbnailId: item.product.thumbnailId,
      discountType: item.product.discountType,
      discountAmount: item.product.discountAmount
        ? convertPrice(item.product.discountAmount)
        : null,
      discountPercent: item.product.discountPercent,
      negotiablePrice: item.product.negotiablePrice,
      hidePrice: item.product.hidePrice,
      requiresApproval: item.product.requiresApproval
    }
  }));

  const subtotal = cart.items.reduce((total, item) => {
    if (item.product.hidePrice) return total;

    const price = calculateDiscountedPrice(item.product);
    return total + (price * item.quantity);
  }, 0);

  return { serializedItems, subtotal };
};

export const dispatchCartUpdate = () => {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
};

export const calculateSubtotal = (items: SerializedCartItem[] | CartItemWithProduct[]): number => {
  return items.reduce((total, item) => {
    if (item.product.hidePrice) return total;

    const price = calculateDiscountedPrice(item.product);
    return total + (price * item.quantity);
  }, 0);
};

/**
 * Checks if a cart has any items that are negotiable or have hidden prices
 */
export function hasNegotiableOrHiddenPriceItems(items: any[]) {
  return items.some(item =>
    item.product.negotiablePrice === true ||
    item.product.hidePrice === true
  );
}