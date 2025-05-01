import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [product, distribution] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        select: {
          avgRating: true,
          totalReviews: true
        }
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { productId: id },
        _count: true
      })
    ]);

    if (!product) {
      return new NextResponse('Product not found', { status: 404 });
    }

    const ratingDistribution = Object.fromEntries(
      distribution.map(d => [d.rating, d._count])
    );

    return NextResponse.json({
      avgRating: product.avgRating ? Number(product.avgRating) : null,
      totalReviews: product.totalReviews,
      ratingDistribution
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 