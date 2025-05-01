import { NextRequest } from 'next/server';
import { PATCH as moderateReview } from '@/app/api/reviews/[id]/moderate/route';
import { prisma } from '@/lib/prisma';
import { authHandler } from '@/lib/auth-handler';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
    prisma: {
        review: {
            findUnique: jest.fn(),
            update: jest.fn()
        }
    }
}));

// Mock auth handler
jest.mock('@/lib/auth-handler', () => ({
    authHandler: jest.fn()
}));

// Mock next/cache
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn()
}));

describe('Review Moderation API', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    const createMockRequest = (body: any) => {
        const request = new NextRequest('http://localhost:3000/api/reviews/review-123/moderate', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Override the json method to return the provided body
        request.json = jest.fn().mockResolvedValue(body);

        return request;
    };

    describe('PATCH /api/reviews/[id]/moderate', () => {
        const mockReview = {
            id: 'review-123',
            productId: 'product-123'
        };

        const mockAdminUser = {
            id: 'admin-123',
            role: 'ADMIN',
            name: 'Admin User'
        };

        const mockCustomerUser = {
            id: 'customer-123',
            role: 'CUSTOMER',
            name: 'Customer User'
        };

        it('should allow admins to hide a review', async () => {
            // Mock auth to return admin user
            (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

            // Mock prisma queries
            (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
            (prisma.review.update as jest.Mock).mockResolvedValue({
                ...mockReview,
                isHidden: true,
                hiddenReason: 'Inappropriate content',
                hiddenByUserId: mockAdminUser.id
            });

            // Create request with hide action
            const request = createMockRequest({
                isHidden: true,
                hiddenReason: 'Inappropriate content'
            });
            const params = Promise.resolve({ id: 'review-123' });

            // Call the handler
            const response = await moderateReview(request, { params });

            // Check response
            expect(response.status).toBe(200);

            // Check that prisma update was called with correct parameters
            expect(prisma.review.update).toHaveBeenCalledWith({
                where: { id: 'review-123' },
                data: {
                    isHidden: true,
                    hiddenReason: 'Inappropriate content',
                    hiddenByUserId: mockAdminUser.id
                }
            });
        });

        it('should allow admins to unhide a review', async () => {
            // Mock auth to return admin user
            (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

            // Mock prisma queries
            (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
            (prisma.review.update as jest.Mock).mockResolvedValue({
                ...mockReview,
                isHidden: false,
                hiddenReason: null,
                hiddenByUserId: null
            });

            // Create request with unhide action
            const request = createMockRequest({
                isHidden: false
            });
            const params = Promise.resolve({ id: 'review-123' });

            // Call the handler
            const response = await moderateReview(request, { params });

            // Check response
            expect(response.status).toBe(200);

            // Check that prisma update was called with correct parameters
            expect(prisma.review.update).toHaveBeenCalledWith({
                where: { id: 'review-123' },
                data: {
                    isHidden: false,
                    hiddenReason: null,
                    hiddenByUserId: null
                }
            });
        });

        it('should not allow customers to moderate reviews', async () => {
            // Mock auth to return customer user
            (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

            // Create request
            const request = createMockRequest({
                isHidden: true,
                hiddenReason: 'Inappropriate content'
            });
            const params = Promise.resolve({ id: 'review-123' });

            // Call the handler
            const response = await moderateReview(request, { params });

            // Check response - should return 403 Forbidden
            expect(response.status).toBe(403);

            // Verify prisma was not called
            expect(prisma.review.update).not.toHaveBeenCalled();
        });

        it('should return 404 if review not found', async () => {
            // Mock auth to return admin user
            (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

            // Mock prisma to return null (review not found)
            (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);

            // Create request
            const request = createMockRequest({
                isHidden: true,
                hiddenReason: 'Inappropriate content'
            });
            const params = Promise.resolve({ id: 'non-existent-review' });

            // Call the handler
            const response = await moderateReview(request, { params });

            // Check response - should return 404 Not Found
            expect(response.status).toBe(404);

            // Verify update was not called
            expect(prisma.review.update).not.toHaveBeenCalled();
        });

        it('should handle validation errors', async () => {
            // Mock auth to return admin user
            (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

            // Create request with invalid data (isHidden as a string instead of boolean)
            const request = createMockRequest({
                isHidden: 'true' // This is invalid - should be a boolean
            });
            const params = Promise.resolve({ id: 'review-123' });

            // Call the handler
            const response = await moderateReview(request, { params });

            // Check response - should return 400 Bad Request
            expect(response.status).toBe(400);

            // Verify prisma was not called
            expect(prisma.review.update).not.toHaveBeenCalled();
        });

        it('should handle server errors', async () => {
            // Mock auth to return admin user
            (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

            // Mock prisma queries
            (prisma.review.findUnique as jest.Mock).mockResolvedValue(mockReview);
            (prisma.review.update as jest.Mock).mockRejectedValue(new Error('Database error'));

            // Create request
            const request = createMockRequest({
                isHidden: true,
                hiddenReason: 'Inappropriate content'
            });
            const params = Promise.resolve({ id: 'review-123' });

            // Call the handler
            const response = await moderateReview(request, { params });

            // Check response - should return 500 Internal Server Error
            expect(response.status).toBe(500);
        });
    });
}); 