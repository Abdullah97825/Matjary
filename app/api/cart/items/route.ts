import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authHandler } from '@/lib/auth-handler';
import { updateCartItemSchema, addToCartSchema } from "@/schemas/cart";
import { CartResponse } from '@/types/cart';
import { serializeCartData } from '@/utils/cart';

const productSelect = {
  id: true,
  name: true,
  price: true,
  stock: true,
  images: {
    select: {
      id: true,
      url: true,
      productId: true
    }
  },
  thumbnailId: true,
  thumbnail: {
    select: {
      id: true,
      url: true,
      productId: true
    }
  },
  discountType: true,
  discountAmount: true,
  discountPercent: true,
  negotiablePrice: true,
  hidePrice: true,
  useStock: true
};

export async function POST(request: NextRequest) {
  try {
    const userOrResponse = await authHandler(request);
    if (userOrResponse instanceof NextResponse) {
      return NextResponse.json({
        error: 'Unauthorized',
        items: [],
        subtotal: 0
      } as CartResponse, { status: 401 });
    }

    const user = userOrResponse;
    const json = await request.json();
    const body = addToCartSchema.parse(json);

    await prisma.$transaction(async (tx) => {
      // Get product to check stock
      const product = await tx.product.findUnique({
        where: { id: body.productId },
        select: { stock: true, public: true, useStock: true, isArchived: true }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.isArchived) {
        throw new Error('This product is no longer available');
      }

      if (product.useStock && product.stock < body.quantity) {
        throw new Error('Insufficient stock available');
      }

      if (!product.public) {
        throw new Error('Product is not offered right now');
      }

      let cart = await tx.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                select: productSelect
              }
            }
          }
        },
      });

      if (!cart) {
        cart = await tx.cart.create({
          data: { userId: user.id },
          include: {
            items: {
              include: {
                product: {
                  select: productSelect
                }
              }
            }
          },
        });
      }

      const existingItem = cart.items.find(item => item.productId === body.productId);
      const totalQuantity = existingItem ? existingItem.quantity + body.quantity : body.quantity;

      if (product.useStock && product.stock < totalQuantity) {
        throw new Error('Insufficient stock available');
      }

      if (existingItem) {
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: totalQuantity }
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: body.productId,
            quantity: body.quantity
          }
        });
      }

      return cart;
    });

    // Fetch the updated cart to ensure we have the latest data including the new/updated item
    const updatedCart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: productSelect
            }
          }
        }
      }
    });

    const { serializedItems, subtotal } = serializeCartData(updatedCart);

    return NextResponse.json({
      items: serializedItems,
      subtotal,
      message: 'Item added to cart successfully'
    } as CartResponse);

  } catch (error) {
    console.error('Error adding item to cart:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Something went wrong',
      items: [],
      subtotal: 0
    } as CartResponse, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userOrResponse = await authHandler(request);
    if (userOrResponse instanceof NextResponse) {
      return NextResponse.json({
        error: 'Unauthorized',
        items: [],
        subtotal: 0
      } as CartResponse, { status: 401 });
    }

    const user = userOrResponse;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (itemId) {
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: String(itemId),
          cart: {
            userId: user.id,
          },
        },
      });

      if (!cartItem) {
        return NextResponse.json({
          error: 'Item not found in cart',
          items: [],
          subtotal: 0
        } as CartResponse, { status: 404 });
      }

      await prisma.cartItem.delete({
        where: { id: String(itemId) },
      });

      // Fetch updated cart
      const updatedCart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                select: productSelect
              }
            }
          }
        }
      });

      const { serializedItems, subtotal } = serializeCartData(updatedCart);

      return NextResponse.json({
        items: serializedItems,
        subtotal,
        message: 'Item removed from cart'
      } as CartResponse);
    }

    return NextResponse.json({
      items: [],
      subtotal: 0,
      message: 'Cart cleared successfully'
    } as CartResponse);

  } catch (error) {
    console.error('Error removing cart item(s):', error);
    return NextResponse.json({
      error: 'Internal server error',
      items: [],
      subtotal: 0
    } as CartResponse, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userOrResponse = await authHandler(request);
    if (userOrResponse instanceof NextResponse) {
      return NextResponse.json({
        error: 'Unauthorized',
        items: [],
        subtotal: 0
      } as CartResponse, { status: 401 });
    }

    const user = userOrResponse;
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('itemId');

    const json = await request.json();
    const body = await updateCartItemSchema.parseAsync({ ...json, cartItemId });

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: body.cartItemId,
        cart: {
          userId: user.id,
        },
      },
      include: {
        product: true
      }
    });

    if (!cartItem) {
      return NextResponse.json({
        error: 'Item not found in cart',
        items: [],
        subtotal: 0
      } as CartResponse, { status: 404 });
    }

    // Check stock availability
    if (cartItem.product.useStock && cartItem.product.stock < body.quantity) {
      return NextResponse.json({
        error: 'Not enough stock available',
        items: [],
        subtotal: 0
      } as CartResponse, { status: 400 });
    }

    // Update the cart item quantity
    await prisma.cartItem.update({
      where: { id: body.cartItemId },
      data: { quantity: body.quantity }
    });

    // Get updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: productSelect
            }
          }
        }
      }
    });

    const { serializedItems, subtotal } = serializeCartData(updatedCart);

    return NextResponse.json({
      items: serializedItems,
      subtotal,
      message: 'Cart item updated successfully'
    } as CartResponse);

  } catch (error) {
    console.error('Error updating cart item:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: error.errors[0].message,
        items: [],
        subtotal: 0
      } as CartResponse, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      items: [],
      subtotal: 0
    } as CartResponse, { status: 500 });
  }
} 