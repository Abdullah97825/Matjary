import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

// Schema for removing user from excluded list
const removeExcludedUserSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
});

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userOrResponse = await authHandler(req);
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

        const id = (await params).id;
        const data = await req.json();

        const validationResult = removeExcludedUserSchema.safeParse(data);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.errors[0].message },
                { status: 400 }
            );
        }

        const { userId } = validationResult.data;

        // Verify that promo code exists
        const promoCode = await prisma.promoCode.findUnique({
            where: { id },
            include: {
                excludedUsers: true,
            },
        });

        if (!promoCode) {
            return NextResponse.json(
                { error: 'Promo code not found' },
                { status: 404 }
            );
        }

        // Check if user is excluded
        const existingExclusion = promoCode.excludedUsers.find(eu => eu.userId === userId);
        if (!existingExclusion) {
            return NextResponse.json(
                { error: 'User is not excluded from this promo code' },
                { status: 400 }
            );
        }

        // Remove user exclusion
        await prisma.excludedUser.delete({
            where: {
                id: existingExclusion.id
            },
        });

        return NextResponse.json(
            { message: 'User removed from excluded list successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error removing user from excluded list:', error);
        return NextResponse.json(
            { error: 'An error occurred while removing user from excluded list' },
            { status: 500 }
        );
    }
} 