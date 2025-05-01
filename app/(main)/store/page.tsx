import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { ProductGrid } from '@/components/products/ProductGrid';
import { CategoryFilter } from '@/components/products/CategoryFilter';
import { BrandFilter } from '@/components/products/BrandFilter';
import { SearchInput } from '@/components/products/SearchInput';
import { FeaturedProducts } from '@/components/products/FeaturedProducts';
import { BannerCarousel } from '@/components/promotional/BannerCarousel';
import { ProductGridSkeleton } from '@/components/products/ProductGridSkeleton';
import { FeaturedProductsSkeleton } from '@/components/products/FeaturedProductsSkeleton';
import { CategoryCarousel } from '@/components/categories/CategoryCarousel';
import { BrandCarousel } from '@/components/brands/BrandCarousel';
import { serializeProducts, serializeBrand } from '@/utils/serialization';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ category?: string; brand?: string; search?: string }> }) {
  const params = await searchParams;

  const [promotionalBanners, categories, brands, products, featuredProducts, totalProducts] = await Promise.all([
    prisma.promotionalBanner.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    }),
    prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    }),
    prisma.brand.findMany({
      where: { active: true },
      include: {
        _count: {
          select: { products: true }
        }
      }
    }),
    prisma.product.findMany({
      where: {
        public: true,
        isArchived: false,
        categoryId: params.category,
        brandId: params.brand,
        OR: params.search ? [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
          {
            brand: {
              name: { contains: params.search, mode: 'insensitive' }
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
        attachments: true,
        tags: true,
        thumbnail: true,
      },
      take: 12
    }),
    prisma.product.findMany({
      where: {
        public: true,
        isArchived: false,
        isFeatured: true
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
      }
    }),
    prisma.product.count({
      where: {
        public: true,
        isArchived: false,
        categoryId: params.category,
        brandId: params.brand,
        OR: params.search ? [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
          {
            brand: {
              name: { contains: params.search, mode: 'insensitive' }
            }
          }
        ] : undefined
      }
    })
  ]);

  // Serialize dates for banners
  const serializedBanners = promotionalBanners.map(banner => ({
    ...banner,
    createdAt: banner.createdAt.toISOString(),
    updatedAt: banner.updatedAt.toISOString()
  }));

  // Serialize dates for categories
  const serializedCategories = categories.map(category => ({
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString()
  }));

  // Serialize brands
  const serializedBrands = brands.map(brand => serializeBrand(brand));

  const serializedProducts = serializeProducts(products);
  const serializedFeaturedProducts = serializeProducts(featuredProducts);

  return (
    <main className="min-h-screen">
      {/* Promotional Carousel */}
      <BannerCarousel banners={serializedBanners} />

      {/* Featured Products Section */}
      {serializedFeaturedProducts.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-2xl font-bold text-gray-900">Featured Products</h2>
            <Suspense fallback={<FeaturedProductsSkeleton />}>
              <FeaturedProducts products={serializedFeaturedProducts} />
            </Suspense>
          </div>
        </section>
      )}

      {/* Categories Section */}
      {serializedCategories.length > 0 && (
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-2xl font-bold text-gray-900">Shop by Category</h2>
            <CategoryCarousel categories={serializedCategories} />
          </div>
        </section>
      )}

      {/* Brands Section */}
      {serializedBrands.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-2xl font-bold text-gray-900">Shop by Brand</h2>
            <BrandCarousel brands={serializedBrands} />
          </div>
        </section>
      )}

      {/* All Products Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <SearchInput defaultValue={params.search} />
              <div className="flex gap-4">
                <CategoryFilter
                  categories={serializedCategories}
                  selectedCategory={params.category}
                />
                <BrandFilter
                  brands={serializedBrands}
                  selectedBrand={params.brand}
                />
              </div>
            </div>
          </div>

          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid
              initialProducts={serializedProducts}
              categoryId={params.category}
              brandId={params.brand}
              searchTerm={params.search}
              initialPagination={{
                pageIndex: 0,
                pageSize: 12,
                pageCount: Math.ceil(totalProducts / 12),
                total: totalProducts
              }}
            />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
