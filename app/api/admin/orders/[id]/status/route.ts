import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from "@/lib/auth-handler";
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

interface OrderStatusParams {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: NextRequest,
  { params }: OrderStatusParams
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
    const body = await request.json();
    const { status } = body;

    if (!Object.values(OrderStatus).includes(status)) {
      return new NextResponse('Invalid status', { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('[ORDER_STATUS_UPDATE]', error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
} 