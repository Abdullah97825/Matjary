import { ReviewStats } from './ReviewStats';
import { ReviewsList } from './ReviewsList';
import { ReviewForm } from './ReviewForm';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface ProductReviewsProps {
  productId: string;
}

export async function ProductReviews({ productId }: ProductReviewsProps) {
  const user = await getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';

  const userOrder = user ? await prisma.order.findFirst({
    where: {
      userId: user.id,
      items: {
        some: {
          productId
        }
      },
      status: 'COMPLETED'
    },
    orderBy: {
      createdAt: 'desc'
    }
  }) : null;

  const existingReview = user ? await prisma.review.findFirst({
    where: {
      userId: user.id,
      productId
    }
  }) : null;

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-8">Customer Reviews</h2>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <div>
          <ReviewStats productId={productId} />
        </div>

        <div className="space-y-8">
          {user ? (
            userOrder && !existingReview ? (
              <ReviewForm
                productId={productId}
                orderId={userOrder.id}
              />
            ) : existingReview ? (
              <p className="text-sm text-gray-500">
                You have already reviewed this product.
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                You need to purchase this product before leaving a review.
              </p>
            )
          ) : (
            <p className="text-sm text-gray-500">
              Please <a href="/login" className="text-blue-600 hover:underline">log in</a> to write a review.
            </p>
          )}

          <ReviewsList productId={productId} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
} 