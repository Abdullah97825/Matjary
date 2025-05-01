import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from "@/lib/auth-handler";
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface OrderCancelParams {
    params: Promise<{ id: string }>
}

// Schema for order cancellation
const orderCancelSchema = z.object({
    restoreStock: z.boolean(),
    note: z.string().optional()
});

export async function POST(
    request: NextRequest,
    { params }: OrderCancelParams
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

        const { id: orderId } = await params;

        // Fetch the existing order to validate it exists
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Only allow cancellation from ACCEPTED status
        if (order.status !== 'ACCEPTED') {
            return NextResponse.json(
                {
                    error: "Invalid operation",
                    message: "Only accepted orders can be cancelled with stock restoration option"
                },
                { status: 400 }
            );
        }

        // Parse the request body
        const body = await request.json();
        let validatedData;

        try {
            validatedData = orderCancelSchema.parse(body);
        } catch (error) {
            return NextResponse.json(
                { error: "Invalid request data", details: error },
                { status: 400 }
            );
        }

        // Use a transaction to ensure all operations succeed or fail together
        await prisma.$transaction(async (tx) => {
            // Restore stock if requested
            if (validatedData.restoreStock) {
                for (const item of order.items) {
                    // Fetch the current product to get the latest stock value
                    const product = await tx.product.findUnique({
                        where: { id: item.product.id }
                    });

                    if (product && product.useStock) {
                        // Increase the stock by the item quantity
                        await tx.product.update({
                            where: { id: item.product.id },
                            data: { stock: product.stock + item.quantity }
                        });
                    }
                }
            }

            // Release promo code if any
            if (order.promoCodeId) {
                // Decrement usedCount for the promo code
                await tx.promoCode.update({
                    where: { id: order.promoCodeId },
                    data: {
                        usedCount: {
                            decrement: 1
                        }
                    }
                });

                // If assigned to user, update the user promo code entry
                const userAssignment = await tx.userPromoCode.findFirst({
                    where: {
                        userId: order.userId,
                        promoCodeId: order.promoCodeId
                    }
                });

                if (userAssignment) {
                    await tx.userPromoCode.update({
                        where: { id: userAssignment.id },
                        data: { usedAt: null }
                    });
                }
            }

            // Update the order status to CANCELLED and remove promo code
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    promoCodeId: null,
                    promoDiscount: null
                }
            });

            // Create a history record
            await tx.orderStatusHistory.create({
                data: {
                    orderId: orderId,
                    previousStatus: 'ACCEPTED',
                    newStatus: 'CANCELLED',
                    note: validatedData.note || 'Order cancelled' + (validatedData.restoreStock ? ' with stock restoration' : ' without stock restoration'),
                    createdById: user.id
                }
            });
        });

        // Return success response
        return NextResponse.json({
            success: true,
            message: "Order cancelled successfully" + (validatedData.restoreStock ? " and stock has been restored" : ""),
            order: {
                id: order.id,
                status: 'CANCELLED'
            }
        });
    } catch (error) {
        console.error('[ORDER_CANCEL]', error);
        return NextResponse.json(
            { error: "Failed to cancel order" },
            { status: 500 }
        );
    }
} 