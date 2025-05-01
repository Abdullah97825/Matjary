import { NextResponse } from "next/server";
// import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUploadedFile } from "@/lib/upload";

export async function POST() {
  try {
    // const user = await getCurrentUser();
    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    // Find expired temporary uploads
    const expiredUploads = await prisma.temporaryUpload.findMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    console.log('[CLEANUP] Found expired uploads:', expiredUploads.length);

    // Delete files and database records
    const results = await Promise.all(
      expiredUploads.map(async (upload) => {
        try {
          const fileDeleted = await deleteUploadedFile(upload.url);
          await prisma.temporaryUpload.delete({
            where: { id: upload.id }
          });
          return { url: upload.url, success: true, fileDeleted };
        } catch (error) {
          console.error(`[CLEANUP] Failed to delete ${upload.url}:`, error);
          return { url: upload.url, success: false, error: String(error) };
        }
      })
    );

    return NextResponse.json({
      success: true,
      cleaned: results
    });
  } catch (error) {
    console.error('[CLEANUP]', error);
    return NextResponse.json(
      { error: "Failed to run cleanup" },
      { status: 500 }
    );
  }
}
