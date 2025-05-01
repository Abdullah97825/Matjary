import { ReviewWithUser, CreateReviewInput, ProductReviewStats, ModerateReviewInput } from '@/types/reviews';

export const reviewService = {
  async getProductReviews(productId: string): Promise<ReviewWithUser[]> {
    const response = await fetch(`/api/products/${productId}/reviews`);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    return response.json();
  },

  async getProductReviewStats(productId: string): Promise<ProductReviewStats> {
    const response = await fetch(`/api/products/${productId}/reviews/stats`);
    if (!response.ok) throw new Error('Failed to fetch review stats');
    return response.json();
  },

  async createReview(data: CreateReviewInput): Promise<ReviewWithUser> {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create review');
    return response.json();
  },

  async getUserProductReview(productId: string): Promise<ReviewWithUser | null> {
    const response = await fetch(`/api/reviews/user?productId=${productId}`);
    if (!response.ok) throw new Error('Failed to fetch user review');
    return response.json();
  },

  async moderateReview(reviewId: string, data: ModerateReviewInput): Promise<ReviewWithUser> {
    const response = await fetch(`/api/reviews/${reviewId}/moderate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Failed to moderate review');
    }

    return response.json();
  }
}; 