import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';
import { serializeCartData } from '@/utils/cart';
import { CartResponse } from '@/types/cart';

export async function GET(request: NextRequest) {
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
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                discountType: true,
                discountAmount: true,
                discountPercent: true,
                images: {
                  select: {
                    id: true,
                    url: true,
                    productId: true,
                  }
                },
                thumbnailId: true,
                thumbnail: true,
                negotiablePrice: true,
                hidePrice: true,
                requiresApproval: true,
              }
            }
          }
        }
      }
    });

    const { serializedItems, subtotal } = serializeCartData(cart);
    return NextResponse.json({
      items: serializedItems,
      subtotal,
      message: 'Cart retrieved successfully'
    } as CartResponse);
  } catch (error) {
    return NextResponse.json({
      error: 'Internal Server Error',
      items: [],
      subtotal: 0,
      details: error instanceof Error ? error.message : String(error)
    } as CartResponse, { status: 500 });
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
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      return NextResponse.json({
        error: 'Cart not found',
        items: [],
        subtotal: 0
      } as CartResponse, { status: 404 });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({
      message: 'Cart cleared successfully',
      items: [],
      subtotal: 0
    } as CartResponse);

  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json({
      error: 'Something went wrong',
      items: [],
      subtotal: 0
    } as CartResponse, { status: 500 });
  }
}