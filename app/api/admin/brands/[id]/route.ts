import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { serializeBrand } from "@/utils/serialization"
import { Prisma } from "@prisma/client"
import { authHandler } from "@/lib/auth-handler"

export const dynamic = 'force-dynamic'

// GET handler for retrieving a single brand by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id

        const brand = await prisma.brand.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        })

        if (!brand) {
            return NextResponse.json(
                { error: "Brand not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(serializeBrand(brand))
    } catch (error) {
        console.error("[BRAND_GET]", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

// PATCH handler for updating a brand
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const id = (await params).id

        const existingBrand = await prisma.brand.findUnique({
            where: { id }
        })

        if (!existingBrand) {
            return NextResponse.json(
                { error: "Brand not found" },
                { status: 404 }
            )
        }

        // Parse the request body
        const body = await request.json()

        // Validate the request body
        const schema = z.object({
            name: z.string().min(1).optional(),
            description: z.string().nullish(),
            imageUrl: z.string()
                .url("Must be a valid URL")
                .or(z.string().regex(/^\/.*/, "Must start with /"))
                .nullish(),
            active: z.boolean().optional()
        })

        const validatedData = schema.parse(body)

        // Generate a new slug if name is provided
        const data: Prisma.BrandUpdateInput = { ...validatedData }

        if (validatedData.name) {
            data.slug = validatedData.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
        }

        // Update the brand
        const brand = await prisma.brand.update({
            where: { id },
            data,
            include: {
                _count: {
                    select: { products: true }
                }
            }
        })

        return NextResponse.json(serializeBrand(brand))
    } catch (error) {
        console.error("[BRAND_PATCH]", error)

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

// DELETE handler for removing a brand
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const id = (await params).id

        // Check if brand exists and has associated products
        const existingBrand = await prisma.brand.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        })

        if (!existingBrand) {
            return NextResponse.json(
                { error: "Brand not found" },
                { status: 404 }
            )
        }

        // Prevent deletion if brand has products
        if (existingBrand._count.products > 0) {
            return NextResponse.json(
                { error: "Cannot delete brand with associated products" },
                { status: 400 }
            )
        }

        // Delete the brand
        await prisma.brand.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[BRAND_DELETE]", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
} 