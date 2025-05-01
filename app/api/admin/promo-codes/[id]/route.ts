import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';
import { formatPromoCodeResponse } from '@/utils/promo';

// Schema for updating a promo code
const updatePromoCodeSchema = z.object({
    code: z.string().min(1, 'Promo code is required').optional(),
    description: z.string().optional().nullable(),
    discountType: z.enum(['NONE', 'FLAT', 'PERCENTAGE', 'BOTH']).optional(),
    discountAmount: z.number().optional().nullable(),
    discountPercent: z.number().optional().nullable(),
    hasExpiryDate: z.boolean().optional(),
    expiryDate: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    maxUses: z.number().optional().nullable(),
    minOrderAmount: z.number().optional().nullable(),
    userAssignments: z.array(
        z.object({
            userId: z.string(),
            isExclusive: z.boolean().default(false),
            hasExpiryDate: z.boolean().default(false),
            expiryDate: z.string().optional().nullable(),
        })
    ).optional(),
    excludedUserIds: z.array(z.string()).optional(),
});

// GET - Get a specific promo code
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin access
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }

        const user = userOrResponse;

        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized - admin access required' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Get the promo code with all related data
        const promoCode = await prisma.promoCode.findUnique({
            where: { id },
            include: {
                userAssignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                excludedUsers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                orders: {
                    select: { id: true },
                },
            },
        });

        if (!promoCode) {
            return NextResponse.json(
                { error: 'Promo code not found' },
                { status: 404 }
            );
        }

        // Format the response
        const formattedPromoCode = formatPromoCodeResponse(promoCode);

        return NextResponse.json(formattedPromoCode);
    } catch (error) {
        console.error('Error fetching promo code:', error);
        return NextResponse.json(
            { error: 'Failed to fetch promo code' },
            { status: 500 }
        );
    }
}

// PATCH - Update a promo code
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin access
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            console.log('Admin authentication failed on update:', userOrResponse.status);
            return userOrResponse;
        }

        const user = userOrResponse;

        if (user.role !== 'ADMIN') {
            console.log('Non-admin user attempted to update promo code:', user.id);
            return NextResponse.json(
                { error: 'Unauthorized - admin access required' },
                { status: 403 }
            );
        }

        const { id } = await params;
        console.log('Updating promo code with ID:', id);

        // Check if the promo code exists
        const existingPromoCode = await prisma.promoCode.findUnique({
            where: { id },
        });

        if (!existingPromoCode) {
            console.log('Attempted to update non-existent promo code:', id);
            return NextResponse.json(
                { error: 'Promo code not found' },
                { status: 404 }
            );
        }

        // Validate request body
        const body = await request.json();
        console.log('Received promo code update request:', JSON.stringify(body, null, 2));

        const result = updatePromoCodeSchema.safeParse(body);

        if (!result.success) {
            console.error('Validation error in promo code update:', JSON.stringify(result.error.format(), null, 2));
            return NextResponse.json(
                { error: result.error.format() },
                { status: 400 }
            );
        }

        const {
            code,
            description,
            discountType,
            discountAmount,
            discountPercent,
            hasExpiryDate,
            expiryDate,
            isActive,
            maxUses,
            minOrderAmount,
            userAssignments,
            excludedUserIds
        } = result.data;

        // If code is being updated, check if the new code already exists
        if (code && code !== existingPromoCode.code) {
            const codeExists = await prisma.promoCode.findUnique({
                where: { code },
            });

            if (codeExists) {
                return NextResponse.json(
                    { error: 'Promo code already exists' },
                    { status: 400 }
                );
            }
        }

        // Update promo code with a transaction to handle relations
        await prisma.$transaction(async (tx) => {
            // Update the promo code
            await tx.promoCode.update({
                where: { id },
                data: {
                    ...(code && { code }),
                    ...(description !== undefined && { description }),
                    ...(discountType && { discountType }),
                    ...(discountAmount !== undefined && {
                        discountAmount: discountAmount !== null ? discountAmount : null
                    }),
                    ...(discountPercent !== undefined && {
                        discountPercent: discountPercent !== null ? discountPercent : null
                    }),
                    ...(hasExpiryDate !== undefined && { hasExpiryDate }),
                    ...(expiryDate !== undefined && {
                        expiryDate: expiryDate ? new Date(expiryDate) : null
                    }),
                    ...(isActive !== undefined && { isActive }),
                    ...(maxUses !== undefined && {
                        maxUses: maxUses !== null ? maxUses : null
                    }),
                    ...(minOrderAmount !== undefined && {
                        minOrderAmount: minOrderAmount !== null ? minOrderAmount : null
                    }),
                },
            });

            // Handle user assignments if provided
            if (userAssignments) {
                // First, delete existing assignments
                await tx.userPromoCode.deleteMany({
                    where: { promoCodeId: id },
                });

                // Then create new assignments
                for (const assignment of userAssignments) {
                    await tx.userPromoCode.create({
                        data: {
                            userId: assignment.userId,
                            promoCodeId: id,
                            isExclusive: assignment.isExclusive,
                            hasExpiryDate: assignment.hasExpiryDate,
                            expiryDate: assignment.expiryDate
                                ? new Date(assignment.expiryDate)
                                : null,
                        },
                    });
                }
            }

            // Handle excluded users if provided
            if (excludedUserIds) {
                // First, delete existing exclusions
                await tx.excludedUser.deleteMany({
                    where: { promoCodeId: id },
                });

                // Then create new exclusions
                for (const userId of excludedUserIds) {
                    await tx.excludedUser.create({
                        data: {
                            userId,
                            promoCodeId: id,
                        },
                    });
                }
            }
        });

        // Fetch the updated promo code with all related data
        const updatedPromoCode = await prisma.promoCode.findUnique({
            where: { id },
            include: {
                userAssignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                excludedUsers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!updatedPromoCode) {
            return NextResponse.json(
                { error: 'Failed to update promo code' },
                { status: 500 }
            );
        }

        // Format the response
        const formattedPromoCode = formatPromoCodeResponse(updatedPromoCode);

        return NextResponse.json(formattedPromoCode);
    } catch (error) {
        console.error('Error updating promo code:', error);
        return NextResponse.json(
            { error: 'Failed to update promo code' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a promo code
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin access
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }

        const user = userOrResponse;

        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized - admin access required' },
                { status: 403 }
            );
        }

        const { id } = await params;

        // Check if the promo code exists
        const existingPromoCode = await prisma.promoCode.findUnique({
            where: { id },
            include: {
                orders: { select: { id: true } }
            },
        });

        if (!existingPromoCode) {
            return NextResponse.json(
                { error: 'Promo code not found' },
                { status: 404 }
            );
        }

        // Check if the promo code is used in any orders
        if (existingPromoCode.orders.length > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot delete promo code that has been used in orders',
                    orderCount: existingPromoCode.orders.length
                },
                { status: 400 }
            );
        }

        // Delete the promo code and its relations using a transaction
        await prisma.$transaction(async (tx) => {
            // Delete user assignments
            await tx.userPromoCode.deleteMany({
                where: { promoCodeId: id },
            });

            // Delete excluded users
            await tx.excludedUser.deleteMany({
                where: { promoCodeId: id },
            });

            // Delete the promo code
            await tx.promoCode.delete({
                where: { id },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting promo code:', error);
        return NextResponse.json(
            { error: 'Failed to delete promo code' },
            { status: 500 }
        );
    }
} 