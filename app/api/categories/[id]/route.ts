import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type Props = {
    params: Promise<{ id: string }>
}

type ProductWithRating = {
    id: string;
    name: string;
    description: string | null;
    price: Prisma.Decimal;
    stock: number;
    images: {
        id: string;
        url: string;
    }[];
    avgRating: number;
    totalReviews: number;
}

type CategoryWithProducts = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    productCount: number;
    products: ProductWithRating[];
}

/**
 * @route GET /api/categories/[id]
 * @description Get a single category by ID with its products
 * @access Public
 */
export async function GET(
    req: NextRequest,
    { params }: Props
) {
    try {
        const { id } = await params;

        // Find the category by ID
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true }
                },
                products: {
                    where: {
                        public: true,
                        isArchived: false,
                        ...(process.env.NODE_ENV === 'production' ? { active: true } : {})
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true,
                        stock: true,
                        images: {
                            select: {
                                id: true,
                                url: true
                            }
                        },
                        reviews: {
                            select: {
                                rating: true
                            }
                        }
                    },
                    take: 12,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!category) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 404 }
            );
        }

        // Calculate average rating for each product
        // TODO: fix type any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const productsWithRating = category.products.map((product: any) => {
            const ratings = product.reviews.map((r: { rating: number }) => r.rating);
            const avgRating = ratings.length
                ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length
                : 0;

            return {
                ...product,
                avgRating,
                totalReviews: ratings.length,
                reviews: undefined // Remove the reviews from the response
            };
        }) as ProductWithRating[];

        // Transform to include product count
        const transformedCategory: CategoryWithProducts = {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            imageUrl: category.imageUrl,
            productCount: category._count.products,
            products: productsWithRating
        };

        return NextResponse.json(transformedCategory);
    } catch (error) {
        console.error("Failed to fetch category:", error);
        return NextResponse.json(
            { error: "Failed to fetch category" },
            { status: 500 }
        );
    }
}
