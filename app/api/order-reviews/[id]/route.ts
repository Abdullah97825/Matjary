import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authHandler } from '@/lib/auth-handler';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const orderReviewSchema = z.object({
    rating: z.number().min(1).max(5),
    title: z.string().max(100).optional(),
    content: z.string().max(1000).optional(),
    orderId: z.string()
});

export async function PUT(
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

        const body = await request.json();
        const validatedData = orderReviewSchema.parse(body);

        // Verify the orderId in path matches the one in the body
        if (orderId !== validatedData.orderId) {
            return new NextResponse('Order ID mismatch', { status: 400 });
        }

        // Verify user owns this order
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: user.id,
                status: 'COMPLETED'
            }
        });

        if (!order) {
            return new NextResponse('Order not found or not completed', { status: 403 });
        }

        // Check if the review exists and belongs to the user
        const existingReview = await prisma.orderReview.findUnique({
            where: {
                orderId: orderId,
                userId: user.id
            }
        });

        if (!existingReview) {
            return new NextResponse('Review not found', { status: 404 });
        }

        // Update the review
        const updatedReview = await prisma.orderReview.update({
            where: {
                id: existingReview.id
            },
            data: {
                rating: validatedData.rating,
                title: validatedData.title,
                content: validatedData.content,
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

        // Revalidate the order page
        revalidatePath(`/orders/${orderId}`);

        return NextResponse.json(updatedReview);
    } catch (error) {
        console.error('Order review update failed:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 