import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { urls } = await req.json();
    
    // Remove the filesystem tracking cleanup
    await prisma.temporaryUpload.deleteMany({
      where: {
        url: {
          in: urls
        }
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CLEAR_UPLOAD_TRACKING]', error);
    return NextResponse.json(
      { error: "Failed to clear upload tracking" },
      { status: 500 }
    );
  }
} 