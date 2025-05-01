import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from "@/lib/auth-handler";
import { prisma } from '@/lib/prisma';

interface OrderDetailParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: OrderDetailParams
) {
  try {
    const userOrResponse = await authHandler(request);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        promoCode: true
      }
    });

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('[ORDER_DETAIL]', error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
} 