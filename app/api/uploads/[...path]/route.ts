import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { readFile } from 'fs/promises';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {

    const resolvedParams = await params;

    // Log the requested path for debugging
    console.log('[UPLOADS_GET] Requested path:', resolvedParams.path);

    // Handle both URL patterns
    const filePath = join(process.cwd(), 'public/uploads', ...resolvedParams.path);
    console.log('[UPLOADS_GET] Attempting to read file at:', filePath);

    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }[ext || ''] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('[UPLOADS_GET]', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
} 