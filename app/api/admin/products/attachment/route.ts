import { NextRequest, NextResponse } from "next/server"
import { authHandler } from "@/lib/auth-handler"
import { saveProductAttachment } from "@/lib/upload"
import { prisma } from "@/lib/prisma"

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

    const formData = await req.formData()
    const file = formData.get('file') as File
    const productId = formData.get('productId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      )
    }

    // Save file and get URL + name
    const result = await saveProductAttachment(file)
    console.log('[UPLOAD_ATTACHMENT] File saved:', result)

    // Only create database record if productId is provided
    if (productId) {
      // Check if product is archived
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { isArchived: true }
      });

      if (product?.isArchived) {
        return NextResponse.json(
          { error: "Cannot modify archived products. Unarchive the product first." },
          { status: 400 }
        );
      }

      const attachment = await prisma.productAttachment.create({
        data: {
          url: result.url,
          name: result.name,
          product: { connect: { id: productId } }
        }
      })
      console.log('[UPLOAD_ATTACHMENT] Database record created:', attachment)
    } else {
      await prisma.temporaryUpload.create({
        data: {
          url: result.url,
          type: 'ATTACHMENT',
          expiresAt: new Date(Date.now() + 3600000)
        }
      });
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[PRODUCT_ATTACHMENT_UPLOAD]', error)
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    )
  }
} 