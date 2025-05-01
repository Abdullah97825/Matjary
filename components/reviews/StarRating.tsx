"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showEmpty?: boolean;
}

export function StarRating({ rating, size = 'md', showEmpty = true }: StarRatingProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizes[size],
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : showEmpty
              ? 'fill-gray-200 text-gray-200'
              : 'hidden'
          )}
        />
      ))}
    </div>
  );
} 