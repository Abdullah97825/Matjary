import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

// Schema for assigning user to a promo code
const assignUserSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    isExclusive: z.boolean().default(false),
    hasExpiryDate: z.boolean().default(false),
    expiryDate: z.string().optional().nullable(),
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

        const validationResult = assignUserSchema.safeParse(data);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.errors[0].message },
                { status: 400 }
            );
        }

        const { userId, isExclusive, hasExpiryDate, expiryDate } = validationResult.data;

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

        // Check if user already assigned
        const existingAssignment = promoCode.userAssignments.find(ua => ua.userId === userId);
        if (existingAssignment) {
            return NextResponse.json(
                { error: 'User is already assigned to this promo code' },
                { status: 400 }
            );
        }

        // Check if user is excluded - if so, remove from excluded list
        const isExcluded = promoCode.excludedUsers.find(eu => eu.userId === userId);
        if (isExcluded) {
            await prisma.excludedUser.delete({
                where: {
                    id: isExcluded.id
                }
            });
        }

        // Add user assignment
        await prisma.userPromoCode.create({
            data: {
                userId,
                promoCodeId: id,
                isExclusive,
                hasExpiryDate,
                expiryDate: hasExpiryDate && expiryDate ? new Date(expiryDate) : null,
            },
        });

        return NextResponse.json(
            { message: 'User assigned to promo code successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error assigning user to promo code:', error);
        return NextResponse.json(
            { error: 'An error occurred while assigning user to promo code' },
            { status: 500 }
        );
    }
} 