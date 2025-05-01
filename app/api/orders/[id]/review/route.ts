import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authHandler } from '@/lib/auth-handler';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }

        const user = userOrResponse;
        const orderId = (await params).id;

        // Verify user owns this order
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: user.id
            }
        });

        if (!order) {
            return new NextResponse('Order not found', { status: 404 });
        }

        // Get the review
        const review = await prisma.orderReview.findUnique({
            where: {
                orderId: orderId
            },
            include: {
                user: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            }
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error('Order review fetch failed:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 