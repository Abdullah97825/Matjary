import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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
    if (imageUrl.startsWith('/uploads/')) {
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

export async function PATCH(
  req: Request,
  { params }: Props
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: "Banner ID is required" },
        { status: 400 }
      )
    }

    const data = await req.json()
    // Only update fields that were actually provided
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    )

    const banner = await prisma.promotionalBanner.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(banner)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update banner", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: Props
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: "Banner ID is required" },
        { status: 400 }
      )
    }

    // Get the banner to access its image URL before deletion
    const banner = await prisma.promotionalBanner.findUnique({
      where: { id }
    })

    if (!banner) {
      return NextResponse.json(
        { error: "Banner not found" },
        { status: 404 }
      )
    }

    // Delete the banner from the database
    await prisma.promotionalBanner.delete({
      where: { id }
    })

    // Delete the associated image file
    if (banner.imageUrl) {
      await deleteImageFile(banner.imageUrl)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete banner", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 