import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { getCurrentUser } from '@/lib/auth';
import { Tag } from '@prisma/client';
import { convertPrice } from '@/utils/cart';
import { RelatedProductsSection } from '@/components/products/RelatedProductsSection';
import { Suspense } from 'react';
import { ProductReviews } from '@/components/reviews/ProductReviews';
import { OutOfStockNotice } from '@/components/products/OutOfStockNotice';
import { ProductImageCarousel } from '@/components/products/ProductImageCarousel';
import { calculateDiscountedPrice, getDiscountLabel } from '@/utils/price';
import { formatPrice } from '@/utils/format';
import { serializeProductWithImages } from '@/utils/serialization';
import { RelatedProductsSkeleton } from '@/components/products/RelatedProductsSkeleton';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: {
      id,
      public: true,
      isArchived: false
    },
    include: {
      images: true,
      category: true,
      attachments: true,
      tags: true
    }
  });

  if (!product) {
    notFound();
  }

  const user = await getCurrentUser();

  // Sort images to put thumbnail first
  const sortedImages = product.images.map(img => ({
    ...img,
    isThumbnail: img.id === product.thumbnailId
  })).sort((a, b) => {
    if (a.id === product.thumbnailId) return -1;
    if (b.id === product.thumbnailId) return 1;
    return 0;
  });

  // Serialize the product
  const serializedProduct = serializeProductWithImages(product);

  return (
    <div className="container px-4 py-10 md:px-6 lg:px-8 mx-auto">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Product Images */}
        <ProductImageCarousel images={sortedImages} />

        {/* Product Info */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>

          {/* Price Display */}
          <div className="flex items-center gap-2">
            {product.hidePrice ? (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm font-medium">
                Contact for Price
              </span>
            ) : (
              <>
                <p className="text-2xl font-semibold">
                  {formatPrice(calculateDiscountedPrice(serializedProduct))}
                </p>
                {serializedProduct.discountType && (
                  <p className="text-lg text-gray-500 line-through">
                    {formatPrice(convertPrice(product.price))}
                  </p>
                )}
                {getDiscountLabel(serializedProduct) && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                    {getDiscountLabel(serializedProduct)}
                  </span>
                )}
                {product.negotiablePrice && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm font-medium">
                    Negotiable
                  </span>
                )}
              </>
            )}
          </div>

          <div>
            <p className="mt-1 text-sm text-gray-500">Category: {product.category.name}</p>
            {product.tags.length > 0 && (
              <div className="mt-2 flex gap-2">
                {product.tags.map((tag: Tag) => (
                  <span key={tag.id} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="prose prose-sm text-gray-500">
            <p>{product.description}</p>
          </div>

          <div className="space-y-4">
            {!product.hideStock && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-900">Availability:</span>
                <span className={`ml-2 text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            )}

            {product.attachments.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-900">Attachments:</span>
                <ul className="space-y-2">
                  {product.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <a
                        href={attachment.url}
                        download
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {attachment.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.stock > 0 ? (
              user ? (
                <AddToCartButton
                  productId={serializedProduct.id}
                  inStock={true}
                  maxStock={product.useStock ? product.stock : undefined}
                  hideStock={product.hideStock}
                />
              ) : (
                <p className="text-sm text-gray-500">
                  Please <a href="/login" className="text-blue-600 hover:underline">log in</a> to add items to your cart.
                </p>
              )
            ) : (
              <OutOfStockNotice hideStock={product.hideStock} />
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProductsSection
          productId={product.id}
          categoryId={product.categoryId}
          brandId={product.brandId}
          tags={product.tags}
        />
      </Suspense>

      {/* Reviews Section */}
      <Suspense fallback={<div className="mt-16 animate-pulse h-96 bg-gray-100 rounded-lg" />}>
        <ProductReviews productId={serializedProduct.id} />
      </Suspense>
    </div>
  );
} 