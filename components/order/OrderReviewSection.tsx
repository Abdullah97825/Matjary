"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { orderReviewService } from '@/services/orderReview';
import { OrderReviewWithUser } from '@/types/orderReview';
import { OrderReviewForm } from './OrderReviewForm';
import { OrderReviewDisplay } from './OrderReviewDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface OrderReviewSectionProps {
    orderId: string;
    isCompleted: boolean;
    isAdmin?: boolean;
}

export function OrderReviewSection({ orderId, isCompleted, isAdmin = false }: OrderReviewSectionProps) {
    const [review, setReview] = useState<OrderReviewWithUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchReview = async () => {
        try {
            setIsLoading(true);
            const data = await orderReviewService.getOrderReview(orderId);
            setReview(data);
        } catch (error) {
            console.error('Failed to fetch review:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReview();

        // Listen for review submissions
        const handleReviewSubmitted = (e: CustomEvent<{ orderId: string }>) => {
            if (e.detail.orderId === orderId) {
                fetchReview();
            }
        };

        window.addEventListener('orderReviewSubmitted', handleReviewSubmitted as EventListener);

        return () => {
            window.removeEventListener('orderReviewSubmitted', handleReviewSubmitted as EventListener);
        };
    }, [orderId]);

    if (isLoading) {
        return (
            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{isAdmin ? "Customer Review" : "Order Review"}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center p-6">
                        <LoadingSpinner />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Admin view - only show review if it exists
    if (isAdmin) {
        if (!review) {
            return (
                <div className="mt-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Review</CardTitle>
                            <CardDescription>No review has been submitted for this order</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm italic">
                                The customer hasn&apos;t left a review for this order yet.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return (
            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Review</CardTitle>
                        <CardDescription>Customer feedback for this order</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OrderReviewDisplay review={review} canEdit={false} />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Customer view - same as before
    // If order is not completed, don't show the review section
    if (!isCompleted) {
        return null;
    }

    // If there's already a review, show it
    if (review) {
        return (
            <div className="mt-8">
                <OrderReviewDisplay review={review} canEdit={true} />
            </div>
        );
    }

    // Otherwise show a card with a button to add a review
    return (
        <div className="mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>How was your experience?</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 mb-4">
                        Thank you for choosing our store! We&apos;d love to hear about your experience with this order.
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        Leave a Review
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Review Your Order</DialogTitle>
                        <DialogDescription>
                            Share your thoughts about your order experience. Your feedback helps us improve our services.
                        </DialogDescription>
                    </DialogHeader>
                    <OrderReviewForm
                        orderId={orderId}
                        onSuccess={() => setIsDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
} 