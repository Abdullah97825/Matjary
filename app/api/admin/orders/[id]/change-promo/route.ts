import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';
import { validatePromoCode } from '@/lib/promo-validator';

const changePromoSchema = z.object({
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
        const result = changePromoSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.format() },
                { status: 400 }
            );
        }

        const { code } = result.data;

        // Check if the order exists and get necessary information
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

        // Check if order status allows modifications
        if (order.status !== 'PENDING' && order.status !== 'ADMIN_PENDING') {
            return NextResponse.json(
                { error: 'Promo codes can only be changed for pending orders' },
                { status: 400 }
            );
        }

        // Calculate order total
        const orderTotal = order.items.reduce(
            (total, item) => total + Number(item.price) * item.quantity,
            0
        );

        // Validate the new promo code
        const validationResult = await validatePromoCode(code, order.user.id, orderTotal);

        if (!validationResult.isValid || !validationResult.code || !validationResult.discount) {
            return NextResponse.json(
                { error: validationResult.message || 'Invalid promo code' },
                { status: 400 }
            );
        }

        // Get the old promo code details if it exists
        let oldPromoCodeInfo = null;
        if (order.promoCodeId) {
            oldPromoCodeInfo = await prisma.promoCode.findUnique({
                where: { id: order.promoCodeId },
                select: {
                    code: true
                }
            });
        }

        // Now validationResult.code and validationResult.discount are guaranteed to be defined
        const { code: validatedCode, id: promoCodeId } = validationResult.code;
        const { total: discountTotal, type: discountType } = validationResult.discount;
        const discountPercent = validationResult.code.discountPercent;

        // Perform the change in a transaction
        await prisma.$transaction(async (tx) => {
            // Update the order with the new promo code
            return tx.order.update({
                where: { id: orderId },
                data: {
                    promoCodeId: promoCodeId,
                    promoDiscount: discountTotal,
                },
                include: {
                    promoCode: {
                        select: {
                            id: true,
                            code: true,
                            discountType: true,
                            discountPercent: true
                        }
                    }
                }
            });
        });

        // Add an entry to order history
        await prisma.orderStatusHistory.create({
            data: {
                orderId: orderId,
                previousStatus: order.status,
                newStatus: order.status, // Status doesn't change
                note: oldPromoCodeInfo
                    ? `Admin changed promo code from "${oldPromoCodeInfo.code}" to "${validatedCode}" with a discount of ${discountTotal}`
                    : `Admin applied promo code "${validatedCode}" with a discount of ${discountTotal}`,
                createdById: user.id
            }
        });

        // Return promo code details with the discount information
        return NextResponse.json({
            id: promoCodeId,
            code: validatedCode,
            discountAmount: discountTotal,
            discountType: discountType,
            discountPercent: discountPercent,
        });
    } catch (error) {
        console.error('Error changing promo code:', error);
        return NextResponse.json(
            { error: 'An error occurred while changing the promo code' },
            { status: 500 }
        );
    }
} 