import Link from 'next/link';
import { ProductThumbnail } from '@/types/products';
import { convertPrice } from '@/utils/cart';
import { calculateDiscountedPrice, getDiscountLabel } from '@/utils/price';
import { formatPrice } from '@/utils/format';

interface ProductCardProps {
  product: ProductThumbnail;
}

export function ProductCard({ product }: ProductCardProps) {
  const originalPrice = convertPrice(product.price);
  const discountedPrice = calculateDiscountedPrice(product);
  const discountLabel = getDiscountLabel(product);

  // console.log('[PRODUCT_CARD_RENDER]', {
  //   productId: product.id,
  //   productName: product.name,
  //   hasThumbnail: !!product.thumbnail,
  //   thumbnailID: product.thumbnailId,
  //   thumbnailUrl: product.thumbnail?.url,
  //   selectedImageUrl: product.thumbnail?.url || '/images/placeholder.svg'
  // });

  // console.log("URL is:  ", product.thumbnail?.url || '/images/placeholder.svg')
  const imageUrl = product.thumbnail?.url || '/images/placeholder.svg';
  // console.log("-----------------------------------------------------------")

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex h-full w-full flex-col rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="p-4 flex flex-col h-[400px]">
        <div className="relative h-64 w-full flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
          <img
            src={imageUrl}
            alt={product.name}
            sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.stock === 0 && !product.hideStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900">
                Out of Stock
              </span>
            </div>
          )}
          {discountLabel && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm">
              {discountLabel}
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-1 flex-col">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</h3>
          <p className="mt-1 flex-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
          <div className="mt-2 flex items-center gap-2">
            {product.hidePrice ? (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm font-medium">
                Contact for Price
              </span>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-900">
                  {formatPrice(discountedPrice)}
                </p>
                {discountedPrice < originalPrice && (
                  <p className="text-sm text-gray-500 line-through">
                    {formatPrice(originalPrice)}
                  </p>
                )}
                {product.negotiablePrice && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm font-medium">
                    Negotiable
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}