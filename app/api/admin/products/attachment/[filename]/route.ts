import { NextRequest, NextResponse } from "next/server"
import { authHandler } from "@/lib/auth-handler"
import { deleteProductAttachment } from "@/lib/upload"
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
    console.log('[DELETE_ATTACHMENT] Deleting attachment file:', filename)

    // Create the full URL to use for database operations
    const fullUrl = `/uploads/attachments/${filename}`

    // Check if this attachment belongs to an archived product
    const productAttachment = await prisma.productAttachment.findFirst({
      where: { url: fullUrl },
      include: { product: { select: { isArchived: true, id: true } } }
    });

    if (productAttachment?.product?.isArchived) {
      return NextResponse.json(
        { error: "Cannot modify archived products. Unarchive the product first." },
        { status: 400 }
      );
    }

    // Delete file from filesystem
    const { fileDeleted } = await deleteProductAttachment(filename)
    console.log('[DELETE_ATTACHMENT] File deletion result:', { fileDeleted })

    // Delete attachment from database
    console.log('[DELETE_ATTACHMENT] Deleting from database, URL:', fullUrl)

    const deletedAttachment = await prisma.productAttachment.deleteMany({
      where: { url: fullUrl }
    })
    console.log('[DELETE_ATTACHMENT] Database deletion result:', deletedAttachment)

    return NextResponse.json({
      success: true,
      fileDeleted,
      databaseDeleted: deletedAttachment.count > 0
    })
  } catch (error) {
    console.error('[PRODUCT_ATTACHMENT_DELETE]', error)
    return NextResponse.json(
      { error: "Failed to delete attachment", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 