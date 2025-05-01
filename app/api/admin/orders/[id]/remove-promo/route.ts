import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

export async function DELETE(
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

        // Check if the order exists
        const order = await prisma.order.findUnique({
            where: { id: orderId },
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
                { error: 'Promo codes can only be removed from pending orders' },
                { status: 400 }
            );
        }

        // Check if order has a promo code to remove
        if (!order.promoCodeId) {
            return NextResponse.json(
                { error: 'Order does not have a promo code applied' },
                { status: 400 }
            );
        }

        // Get promo code details before removing it
        const promoCodeInfo = await prisma.promoCode.findUnique({
            where: { id: order.promoCodeId! },
            select: {
                code: true
            }
        });

        // Remove the promo code from the order
        await prisma.order.update({
            where: { id: orderId },
            data: {
                promoCodeId: null,
                promoDiscount: null,
            },
        });

        // Add an entry to order history
        await prisma.orderStatusHistory.create({
            data: {
                orderId: orderId,
                previousStatus: order.status,
                newStatus: order.status, // Status doesn't change
                note: `Admin removed promo code "${promoCodeInfo?.code || 'Unknown'}"`,
                createdById: user.id
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Promo code removed successfully'
        });
    } catch (error) {
        console.error('Error removing promo code:', error);
        return NextResponse.json(
            { error: 'An error occurred while removing the promo code' },
            { status: 500 }
        );
    }
} 