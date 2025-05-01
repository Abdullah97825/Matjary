import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';
import { PaymentMethod } from '@prisma/client';
import { isValidStatusTransition } from '@/utils/order';
import { z } from 'zod';

interface OrderStatusParams {
    params: Promise<{ id: string }>
}

// Schema for status update
const updateOrderStatusSchema = z.object({
    status: z.enum([
        'PENDING',
        'REJECTED'
    ]),
    note: z.string().optional()
});

export async function PATCH(
    request: NextRequest,
    { params }: OrderStatusParams
) {
    try {
        const { id: orderId } = await params;

        // Authenticate user
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = userOrResponse;

        // Verify the order belongs to the user
        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
                userId: user.id
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Parse the request body
        const json = await request.json();

        try {
            const { status: newStatus, note } = updateOrderStatusSchema.parse(json);

            // Validate the status transition
            if (!isValidStatusTransition(order.status, newStatus, 'CUSTOMER')) {
                return NextResponse.json(
                    {
                        error: "Invalid status transition",
                        message: `Cannot transition from ${order.status} to ${newStatus} as a customer`
                    },
                    { status: 400 }
                );
            }

            // Prepare update data with proper typing
            const updateData: {
                status: typeof newStatus;
                itemsEdited?: boolean;
                paymentMethod?: PaymentMethod;
            } = {
                status: newStatus
            };

            // When customer is accepting the order after admin edits, reset the itemsEdited flag
            // and set payment method to CASH
            if (newStatus === 'PENDING' && order.status === 'CUSTOMER_PENDING') {
                updateData.itemsEdited = false;
                updateData.paymentMethod = 'CASH';
            }

            // Update the order status
            await prisma.order.update({
                where: { id: orderId },
                data: updateData
            });

            // Create history record
            await prisma.orderStatusHistory.create({
                data: {
                    orderId: orderId,
                    previousStatus: order.status,
                    newStatus: newStatus,
                    note: note,
                    createdById: user.id
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Order status updated successfully'
            });

        } catch (error) {
            console.error('Validation error:', error);
            return NextResponse.json(
                { error: 'Invalid status update data' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 