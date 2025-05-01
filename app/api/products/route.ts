import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { convertPrice } from '@/utils/cart';
import { ProductThumbnail } from '@/types/products';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const page = Number(searchParams.get('page')) || 1;
  const perPage = Number(searchParams.get('per_page')) || 12;
  const skip = (page - 1) * perPage;

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          public: true,
          isArchived: false,
          categoryId: category || undefined,
          brandId: brand || undefined,
          OR: search ? [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            {
              brand: {
                name: { contains: search, mode: 'insensitive' }
              }
            }
          ] : undefined
        },
        include: {
          images: {
            orderBy: {
              id: 'asc'
            }
          },
          category: true,
          brand: true,
          thumbnail: true,
          reviews: {
            select: {
              rating: true
            }
          }
        },
        skip,
        take: perPage
      }),
      prisma.product.count({
        where: {
          public: true,
          isArchived: false,
          categoryId: category || undefined,
          brandId: brand || undefined,
          OR: search ? [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            {
              brand: {
                name: { contains: search, mode: 'insensitive' }
              }
            }
          ] : undefined
        }
      })
    ]);

    const serializedProducts: ProductThumbnail[] = products.map(product => {
      // Calculate average rating from reviews
      const ratings = product.reviews?.map(r => r.rating) || [];
      const avgRating = ratings.length
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;

      return {
        ...product,
        price: convertPrice(product.price),
        avgRating,
        totalReviews: ratings.length,
        discountAmount: product.discountAmount ? convertPrice(product.discountAmount) : null,
        thumbnail: product.thumbnailId
          ? product.images.find(img => img.id === product.thumbnailId) || null
          : product.images[0] || null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        category: {
          ...product.category,
          createdAt: product.category.createdAt.toISOString(),
          updatedAt: product.category.updatedAt.toISOString()
        },
        brand: product.brand ? {
          ...product.brand,
          createdAt: product.brand.createdAt.toISOString(),
          updatedAt: product.brand.updatedAt.toISOString()
        } : null,
        images: product.images.map(img => ({
          ...img,
          isThumbnail: img.id === product.thumbnailId
        })),
        reviews: undefined // Remove reviews from response to reduce payload size
      };
    });

    return NextResponse.json({
      products: serializedProducts,
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: Math.ceil(total / perPage)
      }
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 