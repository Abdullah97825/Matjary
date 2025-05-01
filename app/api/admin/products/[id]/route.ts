import { NextRequest, NextResponse } from "next/server"
import { authHandler } from "@/lib/auth-handler"
import { prisma } from "@/lib/prisma"
import { ProductUpdateData } from "@/types/products"
import { deleteUploadedFile } from "@/lib/upload"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        attachments: true,
        category: true,
        brand: true,
        tags: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('[PRODUCT_GET]', error)
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const data: ProductUpdateData = await req.json()

    // Get existing product to check public status change
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { images: true }
    });

    if (!existingProduct) {
      throw new Error("Product not found");
    }

    // Prevent editing archived products
    if (existingProduct.isArchived) {
      return NextResponse.json(
        { error: "Cannot edit archived products. Unarchive the product first." },
        { status: 400 }
      )
    }

    // Create tag connections only if tags are provided
    const tagConnections = data.tags ? await Promise.all(
      data.tags.map(async (tagName) => {
        const tag = await prisma.tag.upsert({
          where: { name: tagName.toLowerCase() },
          update: {},
          create: { name: tagName.toLowerCase() }
        })
        return { id: tag.id }
      })
    ) : undefined

    // Calculate images to delete and create
    const existingUrls = existingProduct.images.map(img => img.url);
    const urlsToDelete = existingUrls.filter(url => !(data.images || []).includes(url));
    const urlsToCreate = (data.images || []).filter(url => !existingUrls.includes(url));

    // Use transaction to ensure data consistency
    const product = await prisma.$transaction(async (tx) => {
      // If product is being made private, remove it from all carts
      if (existingProduct.public && !data.public) {
        await tx.cartItem.deleteMany({
          where: { productId: id }
        });
      }

      // Handle image changes
      await tx.productImage.deleteMany({
        where: { url: { in: urlsToDelete } }
      });

      for (const url of urlsToCreate) {
        await tx.productImage.create({
          data: { url, productId: id }
        });
      }

      // Get updated images list with IDs
      const updatedImages = await tx.productImage.findMany({
        where: { productId: id }
      });

      // Find preserved thumbnail ID
      const preservedThumbnail = existingProduct.thumbnailId
        ? updatedImages.find(img =>
          img.id === existingProduct.thumbnailId &&
          data.images?.includes(img.url)
        )
        : null;

      // Update the product
      return await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description ? { set: data.description } : undefined,
          price: data.price,
          stock: data.stock,
          categoryId: data.categoryId,
          brandId: data.brandId,
          discountType: data.discountType,
          discountAmount: data.discountAmount,
          discountPercent: data.discountPercent,
          tags: tagConnections ? {
            set: [],
            connect: tagConnections
          } : undefined,
          thumbnailId: preservedThumbnail?.id ?? null,
          public: data.public,
          isFeatured: data.isFeatured,
          negotiablePrice: data.negotiablePrice,
          hidePrice: data.hidePrice,
          hideStock: data.hideStock,
          useStock: data.useStock
        },
        include: {
          images: true,
          attachments: true,
          category: true,
          brand: true,
          tags: true
        }
      });
    });

    return NextResponse.json(product)
  } catch (error) {
    console.error('[PRODUCT_PATCH] Error:', error);

    return NextResponse.json(
      { error: "Failed to update product", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrResponse = await authHandler(req);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if product is referenced in orders, carts, or reviews
    const [orderItems, cartItems, reviews] = await Promise.all([
      prisma.orderItem.findFirst({ where: { productId: id } }),
      prisma.cartItem.findFirst({ where: { productId: id } }),
      prisma.review.findFirst({ where: { productId: id } })
    ]);

    if (orderItems) {
      return NextResponse.json({
        error: "Cannot delete this product because it's referenced in orders",
        type: "referenced_in_orders"
      }, { status: 400 });
    }

    if (cartItems) {
      // We can automatically remove cart items
      await prisma.cartItem.deleteMany({ where: { productId: id } });
    }

    if (reviews) {
      return NextResponse.json({
        error: "Cannot delete this product because it has reviews",
        type: "has_reviews"
      }, { status: 400 });
    }

    // Get product with its images and attachments
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true, attachments: true }
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Delete all files first
    const deletePromises = [
      ...product.images.map(img => deleteUploadedFile(img.url)),
      ...product.attachments.map(att => deleteUploadedFile(att.url))
    ]
    await Promise.all(deletePromises)

    // Delete product and all related records (using cascade)
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PRODUCT_DELETE]', error)
    return NextResponse.json(
      { error: "Failed to delete product", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 