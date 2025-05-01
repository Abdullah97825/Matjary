"use client";

import { useState, useEffect, useCallback } from 'react';
import { ReviewWithUser, ModerateReviewInput } from '@/types/reviews';
import { StarRating } from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { reviewService } from '@/services/review';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, InfoIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

interface ReviewsListProps {
  productId: string;
  isAdmin?: boolean;
}

export function ReviewsList({ productId, isAdmin = false }: ReviewsListProps) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewWithUser | null>(null);
  const [showHideDialog, setShowHideDialog] = useState(false);
  const [showUnhideDialog, setShowUnhideDialog] = useState(false);
  const [hiddenReason, setHiddenReason] = useState('');
  const [isModerating, setIsModerating] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await reviewService.getProductReviews(productId);
      setReviews(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();

    // Listen for review submissions
    const handleReviewSubmitted = (e: CustomEvent<{ productId: string }>) => {
      if (e.detail.productId === productId) {
        fetchReviews();
      }
    };

    window.addEventListener('reviewSubmitted', handleReviewSubmitted as EventListener);

    return () => {
      window.removeEventListener('reviewSubmitted', handleReviewSubmitted as EventListener);
    };
  }, [fetchReviews, productId]);

  const openHideDialog = (review: ReviewWithUser) => {
    setSelectedReview(review);
    setHiddenReason('');
    setShowHideDialog(true);
  };

  const openUnhideDialog = (review: ReviewWithUser) => {
    setSelectedReview(review);
    setShowUnhideDialog(true);
  };

  const handleHideReview = async () => {
    if (!selectedReview) return;

    setIsModerating(true);
    try {
      const data: ModerateReviewInput = {
        isHidden: true,
        hiddenReason: hiddenReason.trim() || undefined
      };

      await reviewService.moderateReview(selectedReview.id, data);
      await fetchReviews();
      setShowHideDialog(false);
      toast.success('Review has been hidden');
    } catch (error) {
      toast.error('Failed to hide review');
      console.error(error);
    } finally {
      setIsModerating(false);
    }
  };

  const handleUnhideReview = async () => {
    if (!selectedReview) return;

    setIsModerating(true);
    try {
      await reviewService.moderateReview(selectedReview.id, { isHidden: false });
      await fetchReviews();
      setShowUnhideDialog(false);
      toast.success('Review is now visible');
    } catch (error) {
      toast.error('Failed to unhide review');
      console.error(error);
    } finally {
      setIsModerating(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (reviews.length === 0) {
    return <div className="text-gray-500">No reviews yet</div>;
  }

  return (
    <>
      <div className="space-y-8">
        {reviews.map((review) => (
          <div
            key={review.id}
            className={`space-y-3 rounded-lg border ${review.isHidden ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-white'
              } p-4 shadow-sm transition-shadow hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={review.user.image || undefined} />
                  <AvatarFallback>
                    {review.user.name?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{review.user.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {review.isHidden && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-red-100 px-2 py-1 rounded text-xs text-red-600 flex items-center gap-1">
                          <EyeOff size={12} />
                          <span>Hidden</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Hidden by: {review.hiddenBy?.name || 'Admin'}</p>
                        {review.hiddenReason && (
                          <p className="mt-1 text-xs">Reason: {review.hiddenReason}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <StarRating rating={review.rating} size="sm" />
              </div>
            </div>

            {review.title && (
              <h4 className="font-medium text-gray-900">{review.title}</h4>
            )}

            {review.content && (
              <div className="relative">
                <p className={`text-gray-600 text-sm leading-relaxed ${review.isHidden ? 'opacity-50' : ''}`}>
                  {review.content}
                </p>
                {review.isHidden && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-red-100 px-2 py-1 rounded text-xs text-red-600">
                      Content hidden by admin
                    </span>
                  </div>
                )}
              </div>
            )}

            {isAdmin && (
              <div className="flex justify-end pt-2">
                {!review.isHidden ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => openHideDialog(review)}
                  >
                    <EyeOff size={16} className="mr-1" />
                    Hide Review
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openUnhideDialog(review)}
                  >
                    <Eye size={16} className="mr-1" />
                    Unhide Review
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hide Review Dialog */}
      <Dialog open={showHideDialog} onOpenChange={setShowHideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hide Review</DialogTitle>
            <DialogDescription>
              This will hide the review content from customers, but the rating will still be counted in the product&apos;s average.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm font-medium mb-1">Reason for hiding (optional)</p>
              <Textarea
                placeholder="Explain why this review is being hidden..."
                value={hiddenReason}
                onChange={(e) => setHiddenReason(e.target.value)}
              />
            </div>
            <div className="bg-amber-50 p-3 rounded-md text-sm flex items-start gap-2">
              <InfoIcon size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-amber-700">
                The rating will still be counted in the product&apos;s average rating calculation.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowHideDialog(false)}
              disabled={isModerating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleHideReview}
              disabled={isModerating}
            >
              {isModerating ? <LoadingSpinner size="sm" /> : 'Hide Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unhide Review Dialog */}
      <Dialog open={showUnhideDialog} onOpenChange={setShowUnhideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unhide Review</DialogTitle>
            <DialogDescription>
              This will make the review content visible to all customers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnhideDialog(false)}
              disabled={isModerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnhideReview}
              disabled={isModerating}
            >
              {isModerating ? <LoadingSpinner size="sm" /> : 'Unhide Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 