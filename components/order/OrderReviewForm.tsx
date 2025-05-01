"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { orderReviewService } from '@/services/orderReview';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OrderReviewFormProps {
    orderId: string;
    onSuccess?: () => void;
    initialRating?: number;
    initialTitle?: string;
    initialContent?: string;
    isUpdate?: boolean;
}

export function OrderReviewForm({
    orderId,
    onSuccess,
    initialRating = 0,
    initialTitle = '',
    initialContent = '',
    isUpdate = false
}: OrderReviewFormProps) {
    const [rating, setRating] = useState(initialRating);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        try {
            const data = {
                rating,
                title: title || undefined,
                content: content || undefined,
                orderId
            };

            if (isUpdate) {
                await orderReviewService.updateOrderReview(data);
                toast.success('Review updated successfully');
            } else {
                await orderReviewService.createOrderReview(data);
                toast.success('Review submitted successfully');
            }

            router.refresh();

            const event = new CustomEvent('orderReviewSubmitted', { detail: { orderId } });
            window.dispatchEvent(event);

            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setRating(value)}
                            onMouseEnter={() => setHoveredRating(value)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="transition-colors"
                        >
                            <Star
                                className={`h-8 w-8 ${value <= (hoveredRating || rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200'
                                    }`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title (Optional)
                </label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    placeholder="Summarize your experience"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                    Review (Optional)
                </label>
                <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={1000}
                    placeholder="Share your thoughts about your order experience"
                    rows={4}
                />
            </div>

            <Button type="submit" disabled={isSubmitting || rating === 0}>
                {isSubmitting ? 'Submitting...' : isUpdate ? 'Update Review' : 'Submit Review'}
            </Button>
        </form>
    );
} 