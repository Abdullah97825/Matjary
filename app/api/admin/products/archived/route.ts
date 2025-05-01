import { NextRequest, NextResponse } from "next/server"
import { authHandler } from "@/lib/auth-handler"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
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
            )
        }

        // Get pagination parameters
        const { searchParams } = new URL(req.url)
        const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
        const perPage = Math.max(1, Math.min(50, Number(searchParams.get('per_page') ?? '10')))
        const search = searchParams.get('search') ?? ''

        // Calculate skip
        const skip = (page - 1) * perPage

        // Build the where clause
        const where: Prisma.ProductWhereInput = {
            isArchived: true
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
            ]
        }

        // Get total count and data in parallel
        const [total, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip,
                take: perPage,
                include: {
                    images: true,
                    category: true,
                    brand: true,
                    tags: true,
                    attachments: true
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            })
        ])

        // Calculate total pages
        const lastPage = Math.ceil(total / perPage)

        return NextResponse.json({
            data: products,
            meta: {
                total,
                per_page: perPage,
                current_page: page,
                last_page: lastPage
            }
        })
    } catch (error) {
        console.error('[ARCHIVED_PRODUCTS]', error)
        return NextResponse.json(
            { error: "Failed to fetch archived products" },
            { status: 500 }
        )
    }
} 