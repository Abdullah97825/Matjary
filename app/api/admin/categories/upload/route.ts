import { NextRequest, NextResponse } from "next/server"
import { authHandler } from "@/lib/auth-handler"
import { saveCategoryImage } from "@/lib/upload"
import { prisma } from "@/lib/prisma"
import fs from 'fs'
import path from 'path'
import { promises as fsPromises } from 'fs'

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
        const categoryId = formData.get('categoryId') as string | null

        if (!file) {
            return NextResponse.json(
                { error: "File is required" },
                { status: 400 }
            )
        }

        const url = await saveCategoryImage(file)
        console.log('[UPLOAD_CATEGORY_IMAGE] File saved:', url)

        // If this is for an existing category, update the category with the new image URL
        if (categoryId) {
            // Get the current category to retrieve its image URL
            const currentCategory = await prisma.category.findUnique({
                where: { id: categoryId }
            })

            // Update the category with the new image URL
            await prisma.category.update({
                where: { id: categoryId },
                data: { imageUrl: url }
            })

            // Delete the old image file if it exists
            if (currentCategory?.imageUrl) {
                await deleteImageFile(currentCategory.imageUrl)
            }

            // Remove temporary upload tracking
            await prisma.temporaryUpload.deleteMany({
                where: { url }
            });
        } else {
            // Track temporary upload
            await prisma.temporaryUpload.create({
                data: {
                    url,
                    type: 'CATEGORY_IMAGE',
                    expiresAt: new Date(Date.now() + 3600000) // 1 hour
                }
            });
        }

        return NextResponse.json({ url })
    } catch (error) {
        console.error('[CATEGORY_IMAGE_UPLOAD]', error)
        return NextResponse.json(
            { error: "Failed to upload category image" },
            { status: 500 }
        )
    }
} 