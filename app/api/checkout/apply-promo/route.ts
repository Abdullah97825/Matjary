import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';
import { validatePromoCode } from '@/lib/promo-validator';

const applyPromoSchema = z.object({
    code: z.string().min(1, 'Promo code is required'),
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
        const result = applyPromoSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.format() },
                { status: 400 }
            );
        }

        const { code, orderId } = result.data;

        // Check if the order exists and belongs to the user
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
            },
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

        // Check if order already has a promo code
        if (order.promoCodeId) {
            return NextResponse.json(
                { error: 'Order already has a promo code applied. Remove it first before applying a new one.' },
                { status: 400 }
            );
        }

        // Calculate order total
        const orderTotal = order.items.reduce(
            (total, item) => total + Number(item.price) * item.quantity,
            0
        );

        // Validate the promo code
        const validationResult = await validatePromoCode(code, user.id, orderTotal);

        if (!validationResult.isValid || !validationResult.code || !validationResult.discount) {
            return NextResponse.json(
                { error: validationResult.message || 'Invalid promo code' },
                { status: 400 }
            );
        }

        // Apply the promo code to the order
        await prisma.order.update({
            where: { id: orderId },
            data: {
                promoCodeId: validationResult.code.id,
                promoDiscount: validationResult.discount.total,
            },
        });

        return NextResponse.json({
            id: validationResult.code.id,
            code: validationResult.code.code,
            discountAmount: validationResult.discount.total,
        });
    } catch (error) {
        console.error('Error applying promo code:', error);
        return NextResponse.json(
            { error: 'An error occurred while applying the promo code' },
            { status: 500 }
        );
    }
} 