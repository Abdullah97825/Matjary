import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authHandler } from '@/lib/auth-handler';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(1000).optional(),
  productId: z.string(),
  orderId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const userOrResponse = await authHandler(request);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    // Verify user has ordered this product
    const order = await prisma.order.findFirst({
      where: {
        id: validatedData.orderId,
        userId: user.id,
        items: {
          some: {
            productId: validatedData.productId
          }
        }
      }
    });

    if (!order) {
      return new NextResponse('Product not ordered', { status: 403 });
    }

    // Create or update review
    const review = await prisma.$transaction(async (tx) => {
      const review = await tx.review.upsert({
        where: {
          userId_productId: {
            userId: user.id,
            productId: validatedData.productId
          }
        },
        create: {
          ...validatedData,
          userId: user.id
        },
        update: {
          ...validatedData,
          updatedAt: new Date()
        }
      });

      // Update product stats
      const stats = await tx.review.aggregate({
        where: {
          productId: validatedData.productId
        },
        _avg: {
          rating: true
        },
        _count: true
      });

      await tx.product.update({
        where: { id: validatedData.productId },
        data: {
          avgRating: stats._avg.rating || 0,
          totalReviews: stats._count
        }
      });

      return review;
    });

    revalidatePath(`/products/${validatedData.productId}`);
    return NextResponse.json(review);

  } catch (error) {
    console.error('Review creation failed:', error);
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid review data', { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userOrResponse = await authHandler(request);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return new NextResponse('Product ID required', { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId
        }
      }
    });

    return NextResponse.json(review);

  } catch (error) {
    console.error('Review fetch failed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 