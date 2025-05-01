import { NextRequest } from 'next/server';
import { GET as getProductReviews } from '@/app/api/products/[id]/reviews/route';
import { GET as getReviewStats } from '@/app/api/products/[id]/reviews/stats/route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Review } from '@prisma/client';

type MockReview = {
    id: string;
    rating: number;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    productId: string;
    isHidden: boolean;
    hiddenByUserId: string | null;
    hiddenReason: string | null;
    user: {
        name: string;
        image: string | null;
    };
    hiddenBy?: {
        name: string;
    } | null;
};

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
    prisma: {
        product: {
            findUnique: jest.fn()
        },
        review: {
            findMany: jest.fn(),
            groupBy: jest.fn()
        }
    }
}));

// Mock auth functions
jest.mock('@/lib/auth', () => ({
    getCurrentUser: jest.fn()
}));

// Helper function to create a mock NextRequest
function createRequest(url = 'http://localhost:3000/api/products/123/reviews') {
    return new NextRequest(new URL(url) as unknown as Request);
}

describe('Product Reviews API', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('GET /api/products/[id]/reviews', () => {
        const mockReviews: MockReview[] = [
            {
                id: 'review-123',
                rating: 5,
                title: 'Great Product',
                content: 'Very satisfied with this product',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 'user-123',
                productId: 'product-123',
                isHidden: false,
                hiddenByUserId: null,
                hiddenReason: null,
                user: {
                    name: 'Test User',
                    image: 'https://example.com/user.jpg'
                }
            },
            {
                id: 'review-456',
                rating: 4,
                title: 'Good Product',
                content: 'Pretty good, but could be better',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 'user-456',
                productId: 'product-123',
                isHidden: false,
                hiddenByUserId: null,
                hiddenReason: null,
                user: {
                    name: 'Another User',
                    image: 'https://example.com/another-user.jpg'
                }
            },
            {
                id: 'review-789',
                rating: 2,
                title: 'Hidden Review',
                content: 'This review contains inappropriate content',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 'user-789',
                productId: 'product-123',
                isHidden: true,
                hiddenByUserId: 'admin-123',
                hiddenReason: 'Inappropriate content',
                user: {
                    name: 'Bad User',
                    image: 'https://example.com/bad-user.jpg'
                },
                hiddenBy: {
                    name: 'Admin User'
                }
            }
        ];

        it('should return non-hidden reviews for regular users', async () => {
            // Mock auth to return null or non-admin user
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            // Mock the prisma query
            (prisma.review.findMany as jest.Mock).mockResolvedValue(
                mockReviews.filter(review => review.isHidden === false)
            );

            // Create request and params
            const request = createRequest();
            const params = Promise.resolve({ id: 'product-123' });

            // Call the handler
            const response = await getProductReviews(request, { params });
            const data = await response.json();

            // Check response
            expect(response.status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
            expect(data).toHaveLength(2); // Only non-hidden reviews
            expect(data.some((review: MockReview) => review.isHidden)).toBe(false);

            // Verify the prisma query was called with correct parameters
            expect(prisma.review.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        productId: 'product-123',
                        isHidden: false
                    })
                })
            );
        });

        it('should return all reviews including hidden ones for admin users', async () => {
            // Mock auth to return admin user
            (getCurrentUser as jest.Mock).mockResolvedValue({
                id: 'admin-123',
                role: 'ADMIN',
                name: 'Admin User'
            });

            // Mock the prisma query
            (prisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);

            // Create request and params
            const request = createRequest();
            const params = Promise.resolve({ id: 'product-123' });

            // Call the handler
            const response = await getProductReviews(request, { params });
            const data = await response.json();

            // Check response
            expect(response.status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
            expect(data).toHaveLength(3); // All reviews including hidden
            expect(data.some((review: MockReview) => review.isHidden)).toBe(true);

            // Verify the prisma query was called with correct parameters (no isHidden filter)
            expect(prisma.review.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        productId: 'product-123'
                    }),
                    include: expect.objectContaining({
                        hiddenBy: expect.anything()
                    })
                })
            );

            // The where clause should not have isHidden property for admin
            const whereClause = (prisma.review.findMany as jest.Mock).mock.calls[0][0].where;
            expect(whereClause).not.toHaveProperty('isHidden');
        });

        it('should handle errors properly', async () => {
            // Mock auth to return null
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            // Mock the prisma query to throw an error
            (prisma.review.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

            // Create request and params
            const request = createRequest();
            const params = Promise.resolve({ id: 'product-123' });

            // Call the handler
            const response = await getProductReviews(request, { params });
            const data = await response.json();

            // Check response
            expect(response.status).toBe(500);
            expect(data).toEqual(expect.objectContaining({
                error: expect.any(String)
            }));
        });
    });

    describe('GET /api/products/[id]/reviews/stats', () => {
        const mockProduct = {
            id: 'product-123',
            avgRating: 4.5,
            totalReviews: 10
        };

        const mockDistribution = [
            { rating: 5, _count: 6 },
            { rating: 4, _count: 3 },
            { rating: 3, _count: 1 }
        ];

        it('should return review statistics', async () => {
            // Mock the prisma queries
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
            (prisma.review.groupBy as jest.Mock).mockResolvedValue(mockDistribution);

            // Create request and params
            const request = createRequest('http://localhost:3000/api/products/123/reviews/stats');
            const params = Promise.resolve({ id: 'product-123' });

            // Call the handler
            const response = await getReviewStats(request, { params });
            const data = await response.json();

            // Check response
            expect(response.status).toBe(200);
            expect(data).toEqual({
                avgRating: mockProduct.avgRating,
                totalReviews: mockProduct.totalReviews,
                ratingDistribution: {
                    '5': 6,
                    '4': 3,
                    '3': 1
                }
            });
        });

        it('should return 404 if product is not found', async () => {
            // Mock the prisma query to return null
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

            // Create request and params
            const request = createRequest('http://localhost:3000/api/products/123/reviews/stats');
            const params = Promise.resolve({ id: 'non-existent-product' });

            // Call the handler
            const response = await getReviewStats(request, { params });

            // Check response
            expect(response.status).toBe(404);
        });

        it('should handle errors properly', async () => {
            // Mock the prisma query to throw an error
            (prisma.product.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

            // Create request and params
            const request = createRequest('http://localhost:3000/api/products/123/reviews/stats');
            const params = Promise.resolve({ id: 'product-123' });

            // Call the handler
            const response = await getReviewStats(request, { params });

            // Check response
            expect(response.status).toBe(500);
        });
    });
}); 