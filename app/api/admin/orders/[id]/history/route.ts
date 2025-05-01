import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

interface OrderHistoryParams {
    params: Promise<{ id: string }>
}

export async function GET(
    request: NextRequest,
    { params }: OrderHistoryParams
) {
    try {
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }

        const user = userOrResponse;
        const { id: orderId } = await params;

        // Determine if the user is an admin or the order owner
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { userId: true }
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Only allow access to the order's owner or admins
        if (user.role !== 'ADMIN' && order.userId !== user.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch the order history with user details
        const history = await prisma.orderStatusHistory.findMany({
            where: { orderId },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format response based on user role
        const formattedHistory = history.map(entry => ({
            id: entry.id,
            previousStatus: entry.previousStatus,
            newStatus: entry.newStatus,
            note: entry.note,
            createdAt: entry.createdAt,
            createdBy: user.role === 'ADMIN'
                ? entry.createdBy
                : { name: entry.createdBy.role } // For customers, just show "Admin" rather than the specific admin name
        }));

        return NextResponse.json({ statusHistory: formattedHistory });
    } catch (error) {
        console.error('[ORDER_HISTORY]', error);
        return NextResponse.json(
            { error: "Failed to fetch order history" },
            { status: 500 }
        );
    }
} 