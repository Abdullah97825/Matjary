import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @route GET /api/banners
 * @description Get all active banners for the mobile app
 * @access Public
 */
export async function GET() {
    try {
        // Get all active banners, sorted by order
        const banners = await prisma.promotionalBanner.findMany({
            where: {
                active: true
            },
            orderBy: {
                order: 'asc'
            },
            select: {
                id: true,
                title: true,
                imageUrl: true,
                link: true,
                active: true,
                order: true
            }
        });

        return NextResponse.json(banners);
    } catch (error) {
        console.error("Failed to fetch banners:", error);
        return NextResponse.json(
            { error: "Failed to fetch banners" },
            { status: 500 }
        );
    }
}
