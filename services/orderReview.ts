import { OrderReviewWithUser, CreateOrderReviewInput } from '@/types/orderReview';

export const orderReviewService = {
    async getOrderReview(orderId: string): Promise<OrderReviewWithUser | null> {
        const response = await fetch(`/api/orders/${orderId}/review`);
        if (!response.ok) throw new Error('Failed to fetch order review');
        return response.json();
    },

    async createOrderReview(data: CreateOrderReviewInput): Promise<OrderReviewWithUser> {
        const response = await fetch('/api/order-reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create order review');
        return response.json();
    },

    async updateOrderReview(data: CreateOrderReviewInput): Promise<OrderReviewWithUser> {
        const response = await fetch(`/api/order-reviews/${data.orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update order review');
        return response.json();
    }
}; 