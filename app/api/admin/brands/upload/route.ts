import { NextRequest, NextResponse } from "next/server"
import { authHandler } from "@/lib/auth-handler"
import { saveBrandImage } from "@/lib/upload"
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
        const brandId = formData.get('brandId') as string | null

        if (!file) {
            return NextResponse.json(
                { error: "File is required" },
                { status: 400 }
            )
        }

        const url = await saveBrandImage(file)
        console.log('[UPLOAD_BRAND_IMAGE] File saved:', url)

        // If this is for an existing brand, update the brand with the new image URL
        if (brandId && brandId !== '') {
            // Get the current brand to retrieve its image URL
            const currentBrand = await prisma.brand.findUnique({
                where: { id: brandId }
            })

            // Update the brand with the new image URL
            await prisma.brand.update({
                where: { id: brandId },
                data: { imageUrl: url }
            })

            // Delete the old image file if it exists
            if (currentBrand?.imageUrl) {
                await deleteImageFile(currentBrand.imageUrl)
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
                    type: 'BRAND_IMAGE',
                    expiresAt: new Date(Date.now() + 3600000) // 1 hour
                }
            });
        }

        return NextResponse.json({ url })
    } catch (error) {
        console.error('[BRAND_IMAGE_UPLOAD]', error)
        return NextResponse.json(
            { error: "Failed to upload brand image" },
            { status: 500 }
        )
    }
} 