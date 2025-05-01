import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { authHandler } from "@/lib/auth-handler"
import fs from 'fs'
import path from 'path'
import { promises as fsPromises } from 'fs'

type Props = {
  params: Promise<{ id: string }>
}

// Helper function to delete image file if it exists
async function deleteImageFile(imageUrl: string) {
  try {
    // Only handle files in our uploads directory
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      // Convert URL path to file system path
      const relativePath = imageUrl.replace('/uploads', '')
      const absolutePath = path.join(process.cwd(), 'public/uploads', relativePath)

      // Check if file exists before attempting to delete
      if (fs.existsSync(absolutePath)) {
        await fsPromises.unlink(absolutePath)
        console.log(`Deleted image file: ${absolutePath}`)
      }
    }
  } catch (error) {
    console.error(`Failed to delete image file: ${error}`)
    // Don't throw - we don't want to fail the request if file deletion fails
  }
}

export async function GET(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('[CATEGORY_GET]', error)
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: Props
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
    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    const data = await req.json()
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    )

    const category = await prisma.category.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('[CATEGORY_UPDATE]', error)
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: Props
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
    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      )
    }

    // Get the category to access its image URL before deletion
    const category = await prisma.category.findUnique({
      where: { id }
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Delete the category from the database
    await prisma.category.delete({
      where: { id }
    })

    // Delete the associated image file
    if (category.imageUrl) {
      await deleteImageFile(category.imageUrl)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CATEGORY_DELETE]', error)
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    )
  }
} 