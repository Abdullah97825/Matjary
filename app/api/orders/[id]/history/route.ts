import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authHandler } from '@/lib/auth-handler';

interface OrderHistoryParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(
    request: NextRequest,
    { params }: OrderHistoryParams
) {
    try {
        // Authenticate user
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = userOrResponse;

        const { id: orderId } = await params;


        // Verify if the order belongs to the user
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // For regular users, check if the order belongs to them
        if (user.role !== 'ADMIN' && order.userId !== user.id) {
            return NextResponse.json(
                { error: 'You don\'t have permission to view this order' },
                { status: 403 }
            );
        }

        // Get order history
        const statusHistory = await prisma.orderStatusHistory.findMany({
            where: { orderId: orderId },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                newStatus: true,
                previousStatus: true,
                createdById: true,
                createdBy: {
                    select: {
                        name: true,
                    },
                },
                note: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ statusHistory }, { status: 200 });
    } catch (error) {
        console.error('Error fetching order history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch order history' },
            { status: 500 }
        );
    }
} 