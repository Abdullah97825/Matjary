import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { convertPrice } from '@/utils/cart';
import { ProductThumbnail } from '@/types/products';

/**
 * @route GET /api/products/featured
 * @description Get featured products
 * @access Public
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get('limit')) || 10; // Default to 10 featured products

    try {
        const featuredProducts = await prisma.product.findMany({
            where: {
                public: true,
                isFeatured: true,
                isArchived: false
            },
            include: {
                // Only include the thumbnail image instead of all images
                thumbnail: true,
                category: true,
                reviews: {
                    select: {
                        rating: true
                    }
                }
            },
            take: limit,
            orderBy: {
                createdAt: 'desc' // Most recent featured products first
            }
        });

        // Calculate average rating for each product
        const serializedProducts: ProductThumbnail[] = featuredProducts.map(product => {
            // Calculate average rating if there are reviews
            const ratings = product.reviews.map(r => r.rating);
            const avgRating = ratings.length
                ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
                : 0;

            return {
                ...product,
                price: convertPrice(product.price),
                avgRating,
                totalReviews: ratings.length,
                discountAmount: product.discountAmount ? convertPrice(product.discountAmount) : null,
                thumbnail: product.thumbnail,
                createdAt: product.createdAt.toISOString(),
                updatedAt: product.updatedAt.toISOString(),
                category: {
                    ...product.category,
                    createdAt: product.category.createdAt.toISOString(),
                    updatedAt: product.category.updatedAt.toISOString()
                },
                // We don't need to include all images
                images: product.thumbnail ? [product.thumbnail] : [],
                reviews: undefined // Remove the reviews from the response
            };
        });

        return NextResponse.json(serializedProducts);
    } catch (error) {
        console.error('Failed to fetch featured products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch featured products' },
            { status: 500 }
        );
    }
} 