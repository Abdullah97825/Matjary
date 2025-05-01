"use client";

import { useState, useEffect, useCallback } from 'react';
import { type ReviewStats } from '@/types/reviews';
import { StarRating } from './StarRating';
import { reviewService } from '@/services/review';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Progress } from '@/components/ui/progress';

interface ReviewStatsProps {
  productId: string;
}

export function ReviewStats({ productId }: ReviewStatsProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await reviewService.getProductReviewStats(productId);
      setStats(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load review statistics');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchStats();
    
    // Listen for review submissions
    const handleReviewSubmitted = (e: CustomEvent<{ productId: string }>) => {
      if (e.detail.productId === productId) {
        fetchStats();
      }
    };

    window.addEventListener('reviewSubmitted', handleReviewSubmitted as EventListener);
    
    return () => {
      window.removeEventListener('reviewSubmitted', handleReviewSubmitted as EventListener);
    };
  }, [fetchStats, productId]);

  const formatRating = (rating: number | null): string => {
    if (!rating) return '0.0';
    return rating.toFixed(1);
  };

  const getRoundedRating = (rating: number | null): number => {
    if (!rating) return 0;
    return Math.round(rating);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !stats) {
    return <div className="text-red-500">{error || 'Failed to load statistics'}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold">
              {formatRating(stats.avgRating)}
            </span>
            <StarRating rating={getRoundedRating(stats.avgRating)} size="lg" />
          </div>
          <div className="text-sm text-gray-500">
            {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingDistribution[rating] || 0;
          const percentage = stats.totalReviews > 0
            ? (count / stats.totalReviews) * 100
            : 0;

          return (
            <div key={rating} className="flex items-center gap-2">
              <div className="flex w-12 items-center gap-1">
                <span>{rating}</span>
                <StarRating rating={1} showEmpty={false} size="sm" />
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="w-12 text-sm text-gray-500">
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 