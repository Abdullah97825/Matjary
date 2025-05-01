import { NextRequest, NextResponse } from "next/server"
import { authHandler } from "@/lib/auth-handler"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page')) || 1
    const per_page = Number(searchParams.get('per_page')) || 10
    const search = searchParams.get('search')
    const skip = (page - 1) * per_page

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where: search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } }
          ]
        } : undefined,
        include: {
          _count: {
            select: { products: true }
          }
        },
        skip,
        take: per_page,
        orderBy: { name: 'asc' }
      }),
      prisma.category.count({
        where: search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } }
          ]
        } : undefined
      })
    ])

    return NextResponse.json({
      items: categories,
      total
    })
  } catch (error) {
    console.error('[CATEGORIES_GET]', error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
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

    const data = await req.json()
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: data.description,
        imageUrl: data.imageUrl,
        active: data.active
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('[CATEGORIES_POST]', error)
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    )
  }
} 