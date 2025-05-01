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

export async function POST(request: NextRequest) {
    try {
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }

        const user = userOrResponse;

        const body = await request.json();
        const validatedData = orderReviewSchema.parse(body);

        // Verify user owns this order and it's completed
        const order = await prisma.order.findFirst({
            where: {
                id: validatedData.orderId,
                userId: user.id,
                status: 'COMPLETED'
            }
        });

        if (!order) {
            return new NextResponse('Order not found or not completed', { status: 403 });
        }

        // Check if the user has already reviewed this order
        const existingReview = await prisma.orderReview.findUnique({
            where: {
                orderId: validatedData.orderId
            }
        });

        if (existingReview) {
            return new NextResponse('You have already reviewed this order', { status: 400 });
        }

        // Create the review
        const review = await prisma.orderReview.create({
            data: {
                rating: validatedData.rating,
                title: validatedData.title,
                content: validatedData.content,
                orderId: validatedData.orderId,
                userId: user.id
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
        revalidatePath(`/orders/${validatedData.orderId}`);

        return NextResponse.json(review);
    } catch (error) {
        console.error('Order review creation failed:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 