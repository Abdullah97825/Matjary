import { Suspense } from 'react';
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/products/ProductGrid";
import { CategoryFilter } from '@/components/products/CategoryFilter';
import { BrandFilter } from '@/components/products/BrandFilter';
import { SearchInput } from '@/components/products/SearchInput';
import { ProductGridSkeleton } from '@/components/products/ProductGridSkeleton';
import { CategoryType } from "@/types/products";
import { BrandType } from "@/types/brand";
import { serializeProducts, serializeCategory, serializeBrand } from "@/utils/serialization";
import { Prisma } from '@prisma/client';

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    per_page?: string;
    category?: string;
    brand?: string;
    search?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const perPage = Number(params.per_page) || 12;
  const skip = (page - 1) * perPage;

  // Define where clauses for our queries
  const productWhere = {
    public: true,
    isArchived: false,
    ...(params.category ? { categoryId: params.category } : {}),
    ...(params.brand ? { brandId: params.brand } : {}),
    ...(params.search ? {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' as Prisma.QueryMode } },
        { description: { contains: params.search, mode: 'insensitive' as Prisma.QueryMode } },
        {
          brand: {
            name: { contains: params.search, mode: 'insensitive' as Prisma.QueryMode }
          }
        }
      ]
    } : {})
  };

  const [categories, brands, productsData] = await Promise.all([
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
      where: productWhere,
      include: {
        images: {
          take: 1,
          orderBy: {
            id: 'asc'
          }
        },
        category: true,
        brand: true
      },
      skip,
      take: perPage
    })
  ]);

  const total = await prisma.product.count({
    where: productWhere
  });

  // Use the centralized serialization function
  const serializedProducts = serializeProducts(productsData);

  // Serialize categories
  const serializedCategories: CategoryType[] = categories.map(category => serializeCategory(category));

  // Serialize brands
  const serializedBrands: BrandType[] = brands.map(brand => serializeBrand(brand));

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            pageIndex: page - 1,
            pageSize: perPage,
            pageCount: Math.ceil(total / perPage),
            total
          }}
        />
      </Suspense>
    </main>
  );
} 