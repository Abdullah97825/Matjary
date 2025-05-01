import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';
import { formatPromoCodeResponse } from '@/utils/promo';

// Schema for creating a promo code
const promoCodeSchema = z.object({
    code: z.string().min(1, 'Promo code is required'),
    description: z.string().optional(),
    discountType: z.enum(['NONE', 'FLAT', 'PERCENTAGE', 'BOTH']),
    discountAmount: z.number().optional().nullable(),
    discountPercent: z.number().optional().nullable(),
    hasExpiryDate: z.boolean().default(true),
    expiryDate: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
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

// GET - List all promo codes with pagination
export async function GET(request: NextRequest) {
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

        // Get pagination parameters from URL
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const perPage = parseInt(searchParams.get('per_page') || '10');
        const search = searchParams.get('search') || '';

        // Calculate skip value for pagination
        const skip = (page - 1) * perPage;

        // Create filter based on search term
        let searchFilter = {};
        if (search) {
            searchFilter = {
                OR: [
                    { code: { contains: search } },
                    { description: { contains: search } }
                ]
            };
        }

        // Get total count for pagination metadata
        const total = await prisma.promoCode.count({
            where: searchFilter
        });

        // Get paginated promo codes with related data
        const promoCodes = await prisma.promoCode.findMany({
            where: searchFilter,
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
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take: perPage,
        });

        // Format the response
        const formattedPromoCodes = promoCodes.map(promoCode => formatPromoCodeResponse(promoCode));

        // Create pagination metadata
        const lastPage = Math.ceil(total / perPage);

        return NextResponse.json({
            data: formattedPromoCodes,
            meta: {
                current_page: page,
                last_page: lastPage,
                per_page: perPage,
                total
            }
        });
    } catch (error) {
        console.error('Error fetching promo codes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch promo codes' },
            { status: 500 }
        );
    }
}

// POST - Create a new promo code
export async function POST(request: NextRequest) {
    try {
        // Verify admin access
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            console.log('Admin authentication failed:', userOrResponse.status);
            return userOrResponse;
        }

        const user = userOrResponse;

        if (user.role !== 'ADMIN') {
            console.log('Non-admin user attempted to create promo code:', user.id);
            return NextResponse.json(
                { error: 'Unauthorized - admin access required' },
                { status: 403 }
            );
        }

        // Validate request body
        const body = await request.json();
        console.log('Received promo code create request:', JSON.stringify(body, null, 2));

        const result = promoCodeSchema.safeParse(body);

        if (!result.success) {
            console.error('Validation error in promo code creation:', JSON.stringify(result.error.format(), null, 2));
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

        console.log('Parsed promo code data:', {
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
            userAssignments: userAssignments?.length || 0,
            excludedUserIds: excludedUserIds?.length || 0
        });

        // Check if promo code already exists
        const existingPromoCode = await prisma.promoCode.findUnique({
            where: { code },
        });

        if (existingPromoCode) {
            console.log('Attempted to create duplicate promo code:', code);
            return NextResponse.json(
                { error: 'Promo code already exists' },
                { status: 400 }
            );
        }

        // Create promo code with a transaction to handle user assignments and exclusions
        const promoCode = await prisma.$transaction(async (tx) => {
            // Create the promo code
            const newPromoCode = await tx.promoCode.create({
                data: {
                    code,
                    description,
                    discountType,
                    discountAmount: discountAmount !== null ? discountAmount : null,
                    discountPercent: discountPercent !== null ? discountPercent : null,
                    hasExpiryDate,
                    expiryDate: expiryDate ? new Date(expiryDate) : null,
                    isActive,
                    maxUses,
                    minOrderAmount: minOrderAmount !== null ? minOrderAmount : null,
                },
            });

            // Create user assignments if provided
            if (userAssignments && userAssignments.length > 0) {
                for (const assignment of userAssignments) {
                    await tx.userPromoCode.create({
                        data: {
                            userId: assignment.userId,
                            promoCodeId: newPromoCode.id,
                            isExclusive: assignment.isExclusive,
                            hasExpiryDate: assignment.hasExpiryDate,
                            expiryDate: assignment.expiryDate
                                ? new Date(assignment.expiryDate)
                                : null,
                        },
                    });
                }
            }

            // Create excluded users if provided
            if (excludedUserIds && excludedUserIds.length > 0) {
                for (const userId of excludedUserIds) {
                    await tx.excludedUser.create({
                        data: {
                            userId,
                            promoCodeId: newPromoCode.id,
                        },
                    });
                }
            }

            return newPromoCode;
        });

        // Fetch the created promo code with all related data
        const createdPromoCode = await prisma.promoCode.findUnique({
            where: { id: promoCode.id },
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

        if (!createdPromoCode) {
            return NextResponse.json(
                { error: 'Failed to create promo code' },
                { status: 500 }
            );
        }

        // Format the response
        const formattedPromoCode = formatPromoCodeResponse(createdPromoCode);

        return NextResponse.json(formattedPromoCode, { status: 201 });
    } catch (error) {
        console.error('Error creating promo code:', error);
        return NextResponse.json(
            { error: 'Failed to create promo code' },
            { status: 500 }
        );
    }
} 