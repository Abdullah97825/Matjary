import { NextRequest, NextResponse } from 'next/server';
import { POST as createOrderReviewHandler } from '@/app/api/order-reviews/route';
import { PUT as updateOrderReviewHandler } from '@/app/api/order-reviews/[id]/route';
import { GET as getOrderReviewHandler } from '@/app/api/orders/[id]/review/route';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        order: {
            findFirst: jest.fn(),
            findUnique: jest.fn()
        },
        orderReview: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        }
    }
}));

jest.mock('@/lib/auth-handler', () => ({
    authHandler: jest.fn()
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn()
}));

// Helper function to create mock context with params
const createMockContext = (id: string) => {
    return {
        params: Promise.resolve({ id })
    };
};

describe('OrderReview API', () => {
    const mockUser = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'CUSTOMER',
        image: null
    };

    const mockOrder = {
        id: 'order1',
        userId: 'user1',
        status: 'COMPLETED'
    };

    // Define dates as strings to match JSON response format
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();

    const mockOrderReview = {
        id: 'review1',
        rating: 5,
        title: 'Great Experience',
        content: 'Very satisfied with my order',
        orderId: 'order1',
        userId: 'user1',
        createdAt,
        updatedAt,
        user: {
            name: 'Test User',
            image: null
        }
    };

    const mockOrderReviewInput = {
        rating: 5,
        title: 'Great Experience',
        content: 'Very satisfied with my order',
        orderId: 'order1'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/order-reviews', () => {
        it('should create an order review successfully', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);

            // Mock order exists and belongs to user
            (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

            // Mock no existing review
            (prisma.orderReview.findUnique as jest.Mock).mockResolvedValue(null);

            // Mock successful review creation
            (prisma.orderReview.create as jest.Mock).mockResolvedValue(mockOrderReview);

            const request = new NextRequest('http://localhost/api/order-reviews', {
                method: 'POST',
                body: JSON.stringify(mockOrderReviewInput)
            });

            const response = await createOrderReviewHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toEqual(mockOrderReview);

            expect(prisma.order.findFirst).toHaveBeenCalledWith({
                where: {
                    id: mockOrderReviewInput.orderId,
                    userId: mockUser.id,
                    status: 'COMPLETED'
                }
            });

            expect(prisma.orderReview.create).toHaveBeenCalledWith({
                data: {
                    rating: mockOrderReviewInput.rating,
                    title: mockOrderReviewInput.title,
                    content: mockOrderReviewInput.content,
                    orderId: mockOrderReviewInput.orderId,
                    userId: mockUser.id
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            image: true
                        }
                    }
                }
            });
        });

        it('should return 403 if order not found or not completed', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);

            // Mock order does not exist
            (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/order-reviews', {
                method: 'POST',
                body: JSON.stringify(mockOrderReviewInput)
            });

            const response = await createOrderReviewHandler(request);
            expect(response.status).toBe(403);
            expect(await response.text()).toBe('Order not found or not completed');
        });

        it('should return 400 if user already reviewed the order', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);

            // Mock order exists and belongs to user
            (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

            // Mock existing review
            (prisma.orderReview.findUnique as jest.Mock).mockResolvedValue(mockOrderReview);

            const request = new NextRequest('http://localhost/api/order-reviews', {
                method: 'POST',
                body: JSON.stringify(mockOrderReviewInput)
            });

            const response = await createOrderReviewHandler(request);
            expect(response.status).toBe(400);
            expect(await response.text()).toBe('You have already reviewed this order');
        });

        it('should return 401 if user is not authenticated', async () => {
            // Mock authentication failure
            (authHandler as jest.Mock).mockResolvedValue(new NextResponse('Unauthorized', { status: 401 }));

            const request = new NextRequest('http://localhost/api/order-reviews', {
                method: 'POST',
                body: JSON.stringify(mockOrderReviewInput)
            });

            const response = await createOrderReviewHandler(request);
            expect(response.status).toBe(401);
        });
    });

    describe('PUT /api/order-reviews/[id]', () => {
        it('should update an order review successfully', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);

            // Mock order exists and belongs to user
            (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

            // Mock existing review
            (prisma.orderReview.findUnique as jest.Mock).mockResolvedValue(mockOrderReview);

            // Mock successful review update
            const updatedReview = {
                ...mockOrderReview,
                rating: 4,
                title: 'Updated Title',
                content: 'Updated content'
            };

            (prisma.orderReview.update as jest.Mock).mockResolvedValue(updatedReview);

            const updateInput = {
                ...mockOrderReviewInput,
                rating: 4,
                title: 'Updated Title',
                content: 'Updated content'
            };

            const request = new NextRequest('http://localhost/api/order-reviews/order1', {
                method: 'PUT',
                body: JSON.stringify(updateInput)
            });

            const response = await updateOrderReviewHandler(request, createMockContext('order1'));
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.rating).toBe(4);
            expect(data.title).toBe('Updated Title');
            expect(data.content).toBe('Updated content');

            expect(prisma.orderReview.update).toHaveBeenCalledWith({
                where: {
                    id: mockOrderReview.id
                },
                data: {
                    rating: updateInput.rating,
                    title: updateInput.title,
                    content: updateInput.content
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            image: true
                        }
                    }
                }
            });
        });

        it('should return 404 if review not found', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);

            // Mock order exists and belongs to user
            (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

            // Mock no existing review
            (prisma.orderReview.findUnique as jest.Mock).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/order-reviews/order1', {
                method: 'PUT',
                body: JSON.stringify(mockOrderReviewInput)
            });

            const response = await updateOrderReviewHandler(request, createMockContext('order1'));
            expect(response.status).toBe(404);
            expect(await response.text()).toBe('Review not found');
        });

        it('should return 400 if order ID mismatch', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);

            const request = new NextRequest('http://localhost/api/order-reviews/order1', {
                method: 'PUT',
                body: JSON.stringify({
                    ...mockOrderReviewInput,
                    orderId: 'different-order-id'
                })
            });

            const response = await updateOrderReviewHandler(request, createMockContext('order1'));
            expect(response.status).toBe(400);
            expect(await response.text()).toBe('Order ID mismatch');
        });
    });

    describe('GET /api/orders/[id]/review', () => {
        it('should get an order review successfully', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);

            // Mock order exists and belongs to user
            (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

            // Mock existing review
            (prisma.orderReview.findUnique as jest.Mock).mockResolvedValue(mockOrderReview);

            const request = new NextRequest('http://localhost/api/orders/order1/review');

            const response = await getOrderReviewHandler(request, createMockContext('order1'));
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toEqual(mockOrderReview);
        });

        it('should return null if no review exists', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);

            // Mock order exists and belongs to user
            (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

            // Mock no existing review
            (prisma.orderReview.findUnique as jest.Mock).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/orders/order1/review');

            const response = await getOrderReviewHandler(request, createMockContext('order1'));
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toBeNull();
        });

        it('should return 404 if order not found', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);

            // Mock order does not exist
            (prisma.order.findFirst as jest.Mock).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/orders/order1/review');

            const response = await getOrderReviewHandler(request, createMockContext('order1'));
            expect(response.status).toBe(404);
            expect(await response.text()).toBe('Order not found');
        });

        it('should return 401 if user is not authenticated', async () => {
            // Mock authentication failure
            (authHandler as jest.Mock).mockResolvedValue(new NextResponse('Unauthorized', { status: 401 }));

            const request = new NextRequest('http://localhost/api/orders/order1/review');

            const response = await getOrderReviewHandler(request, createMockContext('order1'));
            expect(response.status).toBe(401);
        });
    });
}); 