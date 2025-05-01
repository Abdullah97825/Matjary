"use client";

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { OrderReviewWithUser } from '@/types/orderReview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OrderReviewForm } from './OrderReviewForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StarRating } from '@/components/reviews/StarRating';

interface OrderReviewDisplayProps {
    review: OrderReviewWithUser;
    canEdit?: boolean;
}

// Helper function to get initials from name
const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

export function OrderReviewDisplay({ review, canEdit = false }: OrderReviewDisplayProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    return (
        <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Order Review</CardTitle>
                {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex items-center mb-3">
                    <StarRating rating={review.rating} />
                    <span className="ml-2 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </span>
                </div>

                {review.title && (
                    <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                )}

                {review.content && (
                    <p className="text-gray-700">{review.content}</p>
                )}

                <div className="flex items-center mt-4">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={review.user.image || undefined} alt={review.user.name} />
                        <AvatarFallback>{getInitials(review.user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 text-sm font-medium">{review.user.name}</span>
                </div>
            </CardContent>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Your Review</DialogTitle>
                        <DialogDescription>
                            Make changes to your order review below. Click the update button when you&apos;re done.
                        </DialogDescription>
                    </DialogHeader>
                    <OrderReviewForm
                        orderId={review.orderId}
                        initialRating={review.rating}
                        initialTitle={review.title || ''}
                        initialContent={review.content || ''}
                        isUpdate={true}
                        onSuccess={() => setIsEditDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </Card>
    );
} 