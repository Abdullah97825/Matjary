import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    serializeCategory,
    safeDecimalConvert,
    toISOString,
    serializeTags
} from '@/utils/serialization';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: {
                id,
                public: true,
                isArchived: false
            },
            include: {
                images: true,
                category: true,
                attachments: true,
                tags: true,
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 5
                }
            }
        });

        if (!product) {
            return new NextResponse('Product not found', { status: 404 });
        }

        // Sort images to put thumbnail first
        const sortedImages = product.images.map(img => ({
            ...img,
            isThumbnail: img.id === product.thumbnailId
        })).sort((a, b) => {
            if (a.id === product.thumbnailId) return -1;
            if (b.id === product.thumbnailId) return 1;
            return 0;
        });

        // Calculate review stats
        const avgRating = product.avgRating ? Number(product.avgRating) : 0;
        const totalReviews = product.totalReviews || 0;

        // Use utility functions from our serialization module
        const serializedProduct = {
            ...product,
            price: safeDecimalConvert(product.price) || 0,
            avgRating,
            totalReviews,
            reviews: product.reviews.map(review => ({
                ...review,
                createdAt: toISOString(review.createdAt),
                updatedAt: toISOString(review.updatedAt)
            })),
            thumbnail: product.thumbnailId
                ? product.images.find(img => img.id === product.thumbnailId) || null
                : product.images[0] || null,
            createdAt: toISOString(product.createdAt),
            updatedAt: toISOString(product.updatedAt),
            category: serializeCategory(product.category),
            tags: serializeTags(product.tags),
            images: sortedImages,
            discountAmount: safeDecimalConvert(product.discountAmount),
            negotiablePrice: !!product.negotiablePrice
        };

        return NextResponse.json(serializedProduct);
    } catch (error) {
        console.error('Error fetching product:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 