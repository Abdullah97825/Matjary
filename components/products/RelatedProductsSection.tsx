import { prisma } from '@/lib/prisma';
import { Tag } from '@prisma/client';
import { serializeProducts } from '@/utils/serialization';
import { RelatedProducts } from './RelatedProducts';

interface RelatedProductsSectionProps {
  productId: string;
  categoryId: string;
  brandId?: string | null;
  tags: Tag[];
}

export function RelatedProductsSection(props: RelatedProductsSectionProps) {
  return (
    <div className="mt-16 min-h-[520px]">
      <RelatedProductsLoader {...props} />
    </div>
  );
}

async function RelatedProductsLoader({ productId, categoryId, brandId, tags }: RelatedProductsSectionProps) {
  const relatedProducts = await prisma.product.findMany({
    where: {
      AND: [
        { public: true },
        { isArchived: false },
        {
          OR: [
            { categoryId },
            brandId ? { brandId } : {},
            { tags: { some: { id: { in: tags.map(tag => tag.id) } } } }
          ]
        },
        { NOT: { id: productId } }
      ]
    },
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
    take: 10,
    orderBy: [
      {
        tags: {
          _count: 'desc'
        }
      }
    ]
  });

  const serializedRelatedProducts = serializeProducts(relatedProducts);

  if (serializedRelatedProducts.length === 0) return null;

  return (
    <section className="mt-16 min-h-[520px]">
      <h2 className="mb-8 text-2xl font-bold text-gray-900">Related Products</h2>
      <RelatedProducts
        products={serializedRelatedProducts}
        currentProductId={productId}
      />
    </section>
  );
} 