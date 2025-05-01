import { z } from "zod"
import { prisma } from "@/lib/prisma"

// Schema for adding new items to cart
export const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1)
});

// Schema for updating existing cart items
export const updateCartItemSchema = z.object({
  cartItemId: z.string(),
  quantity: z.number().min(1)
}).refine(async ({ cartItemId, quantity }) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { product: true }
  });
  // Only check stock if useStock is true
  return cartItem && (!cartItem.product.useStock || cartItem.product.stock >= quantity);
}, {
  message: "Insufficient stock available"
});

export type AddToCartData = z.infer<typeof addToCartSchema>
export type UpdateCartItemData = z.infer<typeof updateCartItemSchema>
