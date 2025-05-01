import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to get the current user (optional, no redirect)
    let isAdmin = false;
    try {
      const user = await getCurrentUser();
      isAdmin = user?.role === 'ADMIN';
    } catch (error) {
      // Ignore auth errors, non-authenticated users can still view non-hidden reviews
      console.error('[GET - Product Reviews] Ignoring auth error getting current user:', error);
    }

    // For non-admin users, filter out hidden reviews
    const whereCondition = {
      productId: id,
      ...(isAdmin ? {} : { isHidden: false })
    };

    const reviews = await prisma.review.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        },
        hiddenBy: isAdmin ? {
          select: {
            name: true
          }
        } : false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch reviews',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 