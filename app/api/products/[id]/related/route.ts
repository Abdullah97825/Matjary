import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { convertPrice } from '@/utils/cart';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get limit from query parameters, default to 10
        const searchParams = request.nextUrl.searchParams;
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 10;

        // First, get the product to find its category and tags
        const product = await prisma.product.findUnique({
            where: {
                id,
                public: true
            },
            include: {
                tags: true
            }
        });

        if (!product) {
            return new NextResponse('Product not found', { status: 404 });
        }

        // Get related products based on the same category, brand, and tags
        const relatedProducts = await prisma.product.findMany({
            where: {
                AND: [
                    { public: true },
                    { isArchived: false },
                    // Prioritize products matching either same category, same brand, or shared tags
                    {
                        OR: [
                            // Same category
                            { categoryId: product.categoryId },
                            // Same brand (if the product has a brand)
                            product.brandId ? { brandId: product.brandId } : {},
                            // Shared tags
                            { tags: { some: { id: { in: product.tags.map(tag => tag.id) } } } }
                        ]
                    },
                    { NOT: { id } } // Exclude the current product
                ]
            },
            include: {
                images: {
                    take: 1,
                    orderBy: {
                        id: 'asc'
                    }
                },
                category: true,
                brand: true
            },
            take: limit,
            orderBy: [
                // Prioritize products with most matching tags
                {
                    tags: {
                        _count: 'desc'
                    }
                }
            ]
        });

        // Serialize the products
        const serializedRelatedProducts = relatedProducts.map(product => ({
            id: product.id,
            name: product.name,
            price: convertPrice(product.price),
            stock: product.stock,
            avgRating: product.avgRating ? Number(product.avgRating) : 0,
            totalReviews: product.totalReviews || 0,
            discountAmount: product.discountAmount ? convertPrice(product.discountAmount) : null,
            discountType: product.discountType,
            discountPercent: product.discountPercent,
            thumbnail: product.thumbnailId
                ? product.images.find(img => img.id === product.thumbnailId)
                : product.images[0] || null,
            category: {
                id: product.category.id,
                name: product.category.name,
                createdAt: product.category.createdAt.toISOString(),
                updatedAt: product.category.updatedAt.toISOString()
            },
            brand: product.brand ? {
                id: product.brand.id,
                name: product.brand.name,
                createdAt: product.brand.createdAt.toISOString(),
                updatedAt: product.brand.updatedAt.toISOString()
            } : null,
            createdAt: product.createdAt.toISOString(),
            updatedAt: product.updatedAt.toISOString()
        }));

        return NextResponse.json(serializedRelatedProducts);
    } catch (error) {
        console.error('Error fetching related products:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 