import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

const removePromoSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
});

export async function POST(request: NextRequest) {
    try {
        // Get the current user
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }
        const user = userOrResponse;

        // Validate request body
        const body = await request.json();
        const result = removePromoSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.format() },
                { status: 400 }
            );
        }

        const { orderId } = result.data;

        // Check if the order exists and belongs to the user
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        if (order.userId !== user.id) {
            return NextResponse.json(
                { error: 'You do not have permission to modify this order' },
                { status: 403 }
            );
        }

        // Check if order has a promo code
        if (!order.promoCodeId) {
            return NextResponse.json(
                { error: 'Order does not have a promo code applied' },
                { status: 400 }
            );
        }

        // Remove the promo code from the order
        await prisma.order.update({
            where: { id: orderId },
            data: {
                promoCodeId: null,
                promoDiscount: null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing promo code:', error);
        return NextResponse.json(
            { error: 'An error occurred while removing the promo code' },
            { status: 500 }
        );
    }
} 