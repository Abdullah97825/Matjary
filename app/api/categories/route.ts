import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @route GET /api/categories
 * @description Get all active categories
 * @access Public
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';

        // Query categories from the database
        const categories = await prisma.category.findMany({
            where: includeInactive ? undefined : { active: true },
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Transform to include product count
        const transformedCategories = categories.map(category => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            imageUrl: category.imageUrl,
            active: category.active,
            productCount: category._count.products
        }));

        return NextResponse.json(transformedCategories);
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}
