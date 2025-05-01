import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

// Schema for excluding user from a promo code
const excludeUserSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
});

export async function POST(
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

        const validationResult = excludeUserSchema.safeParse(data);
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
                excludedUsers: true,
            },
        });

        if (!promoCode) {
            return NextResponse.json(
                { error: 'Promo code not found' },
                { status: 404 }
            );
        }

        // Check if user already excluded
        const existingExclusion = promoCode.excludedUsers.find(eu => eu.userId === userId);
        if (existingExclusion) {
            return NextResponse.json(
                { error: 'User is already excluded from this promo code' },
                { status: 400 }
            );
        }

        // Check if user has an assignment - if so, remove it
        const existingAssignment = promoCode.userAssignments.find(ua => ua.userId === userId);
        if (existingAssignment) {
            await prisma.userPromoCode.delete({
                where: {
                    id: existingAssignment.id
                }
            });
        }

        // Add user exclusion
        await prisma.excludedUser.create({
            data: {
                userId,
                promoCodeId: id,
            },
        });

        return NextResponse.json(
            { message: 'User excluded from promo code successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error excluding user from promo code:', error);
        return NextResponse.json(
            { error: 'An error occurred while excluding user from promo code' },
            { status: 500 }
        );
    }
} 