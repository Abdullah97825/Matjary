import { NextRequest, NextResponse } from "next/server";
import { authHandler } from "@/lib/auth-handler";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { thumbnailId } = await req.json();

    console.log('[THUMBNAIL_UPDATE] Updating product:', id, 'with thumbnailId:', thumbnailId);

    // Check if product is archived
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { isArchived: true }
    });

    if (existingProduct?.isArchived) {
      return NextResponse.json(
        { error: "Cannot modify archived products. Unarchive the product first." },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: { thumbnailId },
      include: {
        images: true,
        thumbnail: true
      }
    });

    console.log('[THUMBNAIL_UPDATE] Updated product:', product);
    console.log('[THUMBNAIL_UPDATE] Previous thumbnail ID:', product.thumbnailId);
    console.log('[THUMBNAIL_UPDATE] New thumbnail ID:', thumbnailId);

    return NextResponse.json(product);
  } catch (error) {
    console.error('[PRODUCT_THUMBNAIL_UPDATE]', error);
    return NextResponse.json(
      { error: "Failed to update thumbnail" },
      { status: 500 }
    );
  }
} 