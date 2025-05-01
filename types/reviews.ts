import { Review, User } from '@prisma/client';

export interface ReviewWithUser extends Review {
  user: {
    name: string;
    image: string | null;
  };
  hiddenBy?: {
    name: string;
  } | null;
}

export interface ProductReviewStats {
  avgRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;  // 1-5: count
  };
}

export interface CreateReviewInput {
  rating: number;
  title?: string;
  content?: string;
  productId: string;
  orderId: string;
}

export type ReviewStats = {
  avgRating: number | null;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export interface ModerateReviewInput {
  isHidden: boolean;
  hiddenReason?: string;
} 