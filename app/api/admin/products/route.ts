import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authHandler } from "@/lib/auth-handler"
import { ProductFormData } from "@/types/products"
import { Prisma } from "@prisma/client"


export async function GET(req: NextRequest) {
  try {
    const userOrResponse = await authHandler(req)
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const user = userOrResponse
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page')) || 1
    const per_page = Number(searchParams.get('per_page')) || 10
    const search = searchParams.get('search') || undefined

    const where: Prisma.ProductWhereInput = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
      ],
      isArchived: false
    } : {
      isArchived: false
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: true,
          category: true,
          brand: true,
          tags: true,
          attachments: true,
          _count: {
            select: {
              reviews: true
            }
          }
        },
        skip: (page - 1) * per_page,
        take: per_page,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      data: products,
      meta: {
        page,
        per_page,
        total,
        last_page: Math.ceil(total / per_page)
      }
    })
  } catch (error) {
    console.error('[PRODUCTS_GET]', error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrResponse = await authHandler(req)
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const user = userOrResponse
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const data: ProductFormData = await req.json()

    // Validate required fields
    if (!data.name || !data.price || data.price <= 0) {
      return NextResponse.json(
        { error: "Name and valid price are required" },
        { status: 400 }
      )
    }

    // Validate categoryId is not empty
    if (!data.categoryId) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      )
    }

    // Create or connect tags
    const tagConnections = await Promise.all(
      data.tags.map(async (tagName) => {
        const tag = await prisma.tag.upsert({
          where: { name: tagName.toLowerCase() },
          update: {},
          create: { name: tagName.toLowerCase() }
        })
        return { id: tag.id }
      })
    )

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || '',
        price: data.price,
        stock: data.stock,
        categoryId: data.categoryId,
        brandId: data.brandId || null,
        discountType: data.discountType || null,
        discountAmount: data.discountAmount || null,
        discountPercent: data.discountPercent || null,
        thumbnailId: data.thumbnailId || null,
        images: {
          create: data.images.map(url => ({ url }))
        },
        attachments: {
          create: data.attachments.map(att => ({
            url: att.url,
            name: att.name
          }))
        },
        tags: {
          connect: tagConnections
        },
        public: data.public,
        isFeatured: data.isFeatured,
        negotiablePrice: data.negotiablePrice || false,
        hidePrice: data.hidePrice || false,
        hideStock: data.hideStock || false,
        useStock: data.useStock ?? true
      },
      include: {
        images: true,
        attachments: true,
        category: true,
        brand: true,
        tags: true
      }
    })

    // Clear tracking for all files that are now associated with the product
    // data.images.forEach(url => clearTempUploadTracking(url));
    // data.attachments.forEach(att => clearTempUploadTracking(att.url));

    return NextResponse.json(product)
  } catch (error) {
    console.error('[PRODUCTS_POST]', error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
} 