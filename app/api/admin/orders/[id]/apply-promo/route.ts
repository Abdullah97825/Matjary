import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';
import { validatePromoCode } from '@/lib/promo-validator';

const applyPromoSchema = z.object({
    code: z.string().min(1, 'Promo code is required'),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Get the current user and check if they're an admin
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }

        const user = userOrResponse;
        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get the order ID from params
        const orderId = (await params).id;

        // Validate request body
        const body = await request.json();
        const result = applyPromoSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.format() },
                { status: 400 }
            );
        }

        const { code } = result.data;

        // Check if the order exists
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                user: {
                    select: {
                        id: true
                    }
                }
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Check if order already has a promo code
        if (order.promoCodeId) {
            return NextResponse.json(
                { error: 'Order already has a promo code applied. Remove it first before applying a new one.' },
                { status: 400 }
            );
        }

        // Check if order status allows modifications
        if (order.status !== 'PENDING' && order.status !== 'ADMIN_PENDING') {
            return NextResponse.json(
                { error: 'Promo codes can only be applied to pending orders' },
                { status: 400 }
            );
        }

        // Calculate order total
        const orderTotal = order.items.reduce(
            (total, item) => total + Number(item.price) * item.quantity,
            0
        );

        // Validate the promo code using the customer's user ID (since promo codes may be user-specific)
        const validationResult = await validatePromoCode(code, order.user.id, orderTotal);

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

        // Add an entry to order history
        await prisma.orderStatusHistory.create({
            data: {
                orderId: orderId,
                previousStatus: order.status,
                newStatus: order.status, // Status doesn't change
                note: `Admin applied promo code "${validationResult.code.code}" with a discount of ${validationResult.discount.total}`,
                createdById: user.id
            }
        });

        return NextResponse.json({
            id: validationResult.code.id,
            code: validationResult.code.code,
            discountAmount: validationResult.discount.total,
            discountType: validationResult.code.discountType,
            discountPercent: validationResult.code.discountPercent,
        });
    } catch (error) {
        console.error('Error applying promo code:', error);
        return NextResponse.json(
            { error: 'An error occurred while applying the promo code' },
            { status: 500 }
        );
    }
} 