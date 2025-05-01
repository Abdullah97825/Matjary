import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ReviewStats } from './ReviewStats';
import { ReviewsList } from './ReviewsList';
import { ReviewForm } from './ReviewForm';

interface ReviewsSectionProps {
  productId: string;
}

export async function ReviewsSection({ productId }: ReviewsSectionProps) {
  const user = await getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const hasOrdered = user ? await prisma.order.findFirst({
    where: {
      userId: user.id,
      items: {
        some: {
          productId
        }
      }
    },
    select: {
      id: true
    }
  }) : null;

  return (
    <div className="mt-16 border-t pt-8">
      <h2 className="mb-8 text-2xl font-bold">Customer Reviews</h2>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <ReviewStats productId={productId} />
          {hasOrdered && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold">Write a Review</h3>
              <ReviewForm
                productId={productId}
                orderId={hasOrdered.id}
              />
            </div>
          )}
        </div>
        <div className="lg:col-span-8">
          <ReviewsList productId={productId} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
} 