import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { serializeBrand } from "@/utils/serialization"
import { Prisma } from "@prisma/client"
import { authHandler } from "@/lib/auth-handler"

export const dynamic = 'force-dynamic'

// GET handler for retrieving all brands with optional filtering and pagination
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search') || undefined
        const active = searchParams.get('active') === 'true' ? true :
            searchParams.get('active') === 'false' ? false :
                undefined

        // Calculate pagination offsets
        const skip = (page - 1) * limit

        // Build where clause for filtering
        const where: Prisma.BrandWhereInput = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (active !== undefined) {
            where.active = active
        }

        // Get brands with count of products
        const [brands, totalCount] = await Promise.all([
            prisma.brand.findMany({
                where,
                include: {
                    _count: {
                        select: { products: true }
                    }
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.brand.count({ where })
        ])

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limit)

        return NextResponse.json({
            items: brands.map(serializeBrand),
            total: totalCount,
            page,
            limit,
            totalPages
        })
    } catch (error) {
        console.error("[BRANDS_GET]", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

// POST handler for creating a new brand
export async function POST(request: NextRequest) {
    try {
        // Check if the user is authenticated and is an admin  
        const userOrResponse = await authHandler(request);
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

        // Parse the request body
        const body = await request.json()

        // Validate the request body
        const schema = z.object({
            name: z.string().min(1),
            description: z.string().nullish(),
            imageUrl: z.string()
                .url("Must be a valid URL")
                .or(z.string().regex(/^\/.*/, "Must start with /"))
                .nullish(),
            active: z.boolean().default(true)
        })

        const validatedData = schema.parse(body)

        // Generate a slug from the name
        const slug = validatedData.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        // Create the brand
        const brand = await prisma.brand.create({
            data: {
                ...validatedData,
                slug
            },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        })

        return NextResponse.json(serializeBrand(brand), { status: 201 })
    } catch (error) {
        console.error("[BRANDS_POST]", error)

        // Handle validation errors
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid request data", details: error.errors },
                { status: 400 }
            )
        }

        // Handle uniqueness constraint errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: "A brand with this name already exists" },
                    { status: 409 }
                )
            }
        }

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
} 