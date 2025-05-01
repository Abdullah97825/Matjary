import { NextRequest, NextResponse } from "next/server"
import { authHandler } from "@/lib/auth-handler"
import { deleteProductImage } from "@/lib/upload"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
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

    const { filename } = await params
    console.log('[DELETE_IMAGE] Deleting image file:', filename)

    // Create the full URL to use for database operations
    const fullUrl = `/uploads/images/${filename}`

    // Check if this image belongs to an archived product
    const productImage = await prisma.productImage.findFirst({
      where: { url: fullUrl },
      include: { product: { select: { isArchived: true, id: true } } }
    });

    if (productImage?.product?.isArchived) {
      return NextResponse.json(
        { error: "Cannot modify archived products. Unarchive the product first." },
        { status: 400 }
      );
    }

    // Delete file from filesystem
    const { fileDeleted } = await deleteProductImage(filename)
    console.log('[DELETE_IMAGE] File deletion result:', { fileDeleted })

    // Delete image from database
    console.log('[DELETE_IMAGE] Deleting from database, URL:', fullUrl)

    const deletedImage = await prisma.productImage.deleteMany({
      where: { url: fullUrl }
    })
    console.log('[DELETE_IMAGE] Database deletion result:', deletedImage)

    return NextResponse.json({
      success: true,
      fileDeleted,
      databaseDeleted: deletedImage.count > 0
    })
  } catch (error) {
    console.error('[PRODUCT_IMAGE_DELETE]', error)
    return NextResponse.json(
      { error: "Failed to delete image", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 