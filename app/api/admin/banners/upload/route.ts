import { NextRequest, NextResponse } from "next/server"
import { authHandler } from "@/lib/auth-handler"
import { savePromotionalBannerImage } from "@/lib/upload"
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
        const bannerId = formData.get('bannerId') as string | null

        if (!file) {
            return NextResponse.json(
                { error: "File is required" },
                { status: 400 }
            )
        }

        const url = await savePromotionalBannerImage(file)
        console.log('[UPLOAD_BANNER_IMAGE] File saved:', url)

        // If this is for an existing banner, update the banner with the new image URL
        if (bannerId) {
            // Get the current banner to retrieve its image URL
            const currentBanner = await prisma.promotionalBanner.findUnique({
                where: { id: bannerId }
            })

            // Update the banner with the new image URL
            await prisma.promotionalBanner.update({
                where: { id: bannerId },
                data: { imageUrl: url }
            })

            // Delete the old image file if it exists
            if (currentBanner?.imageUrl) {
                await deleteImageFile(currentBanner.imageUrl)
            }

            // Add this line to remove temporary upload tracking
            await prisma.temporaryUpload.deleteMany({
                where: { url }
            });
        } else {
            // Track temporary upload
            await prisma.temporaryUpload.create({
                data: {
                    url,
                    type: 'BANNER_IMAGE',
                    expiresAt: new Date(Date.now() + 3600000) // 1 hour
                }
            });
        }

        return NextResponse.json({ url })
    } catch (error) {
        console.error('[BANNER_IMAGE_UPLOAD]', error)
        return NextResponse.json(
            { error: "Failed to upload image" },
            { status: 500 }
        )
    }
} 