import { OrderReview, User } from '@prisma/client';

export interface OrderReviewWithUser extends OrderReview {
    user: {
        name: string;
        image: string | null;
    };
}

export interface CreateOrderReviewInput {
    rating: number;
    title?: string;
    content?: string;
    orderId: string;
} 