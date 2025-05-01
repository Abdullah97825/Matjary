import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authHandler } from '@/lib/auth-handler';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const moderateReviewSchema = z.object({
    isHidden: z.boolean(),
    hiddenReason: z.string().optional(),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication and authorization
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }

        const user = userOrResponse;

        // Only admins can moderate reviews
        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized - admin access required' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Parse and validate the request body
        const body = await request.json();
        const validatedData = moderateReviewSchema.parse(body);

        // Get the review to be moderated
        const review = await prisma.review.findUnique({
            where: { id },
            select: { productId: true }
        });

        if (!review) {
            return NextResponse.json(
                { error: 'Review not found' },
                { status: 404 }
            );
        }

        // Update the review
        const updatedReview = await prisma.review.update({
            where: { id },
            data: {
                isHidden: validatedData.isHidden,
                hiddenReason: validatedData.isHidden ? validatedData.hiddenReason : null,
                hiddenByUserId: validatedData.isHidden ? user.id : null
            }
        });

        // Revalidate the product page to update the reviews
        revalidatePath(`/products/${review.productId}`);

        return NextResponse.json(updatedReview);

    } catch (error) {
        console.error('Review moderation failed:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Server error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 