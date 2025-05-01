import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

// Schema for removing user from a promo code
const removeUserSchema = z.object({
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

        const validationResult = removeUserSchema.safeParse(data);
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
                userAssignments: true,
            },
        });

        if (!promoCode) {
            return NextResponse.json(
                { error: 'Promo code not found' },
                { status: 404 }
            );
        }

        // Check if user is assigned
        const existingAssignment = promoCode.userAssignments.find(ua => ua.userId === userId);
        if (!existingAssignment) {
            return NextResponse.json(
                { error: 'User is not assigned to this promo code' },
                { status: 400 }
            );
        }

        // Remove user assignment
        await prisma.userPromoCode.delete({
            where: {
                id: existingAssignment.id
            },
        });

        return NextResponse.json(
            { message: 'User removed from promo code successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error removing user from promo code:', error);
        return NextResponse.json(
            { error: 'An error occurred while removing user from promo code' },
            { status: 500 }
        );
    }
} 