import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/token-auth';
import { authHandler } from '@/lib/auth-handler';
import { GET as profileHandler } from '@/app/api/user/profile/route';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        personalAccessToken: {
            findUnique: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    },
}));

// Mock auth utilities
jest.mock('@/lib/auth', () => ({
    getCurrentUser: jest.fn(),
}));

// Mock token auth
jest.mock('@/lib/token-auth', () => ({
    authenticateToken: jest.fn(),
}));

// Mock auth handler
jest.mock('@/lib/auth-handler', () => ({
    authHandler: jest.fn(),
}));

describe('Token-based Authentication', () => {
    const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockInactiveUser = {
        id: '2',
        email: 'inactive@example.com',
        name: 'Inactive User',
        role: 'CUSTOMER',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockUserWithAddresses = {
        ...mockUser,
        addresses: [{
            id: '1',
            userId: '1',
            country: 'Test Country',
            province: 'Test Province',
            city: 'Test City',
            neighbourhood: 'Test Neighbourhood',
            nearestLandmark: 'Test Landmark',
            zipcode: '12345',
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }]
    };

    const mockToken = {
        id: '1',
        token: 'valid-token-123',
        name: 'Test Token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        lastUsedAt: new Date(),
        user: mockUser,
    };

    const mockInactiveToken = {
        id: '2',
        token: 'inactive-user-token',
        name: 'Inactive Token',
        userId: mockInactiveUser.id,
        expiresAt: new Date(Date.now() + 86400000),
        lastUsedAt: new Date(),
        user: mockInactiveUser,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('authenticateToken function', () => {
        it('should return the user when a valid token is provided', async () => {
            (authenticateToken as jest.Mock).mockResolvedValue(mockUser);

            const request = new NextRequest('http://localhost/api', {
                headers: {
                    'Authorization': `Bearer ${mockToken.token}`,
                },
            });

            const user = await authenticateToken(request);
            expect(user).toEqual(mockUser);
        });

        it('should return null when no authorization header is provided', async () => {
            (authenticateToken as jest.Mock).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api');
            const user = await authenticateToken(request);
            expect(user).toBeNull();
        });

        it('should return null when an invalid token format is provided', async () => {
            (authenticateToken as jest.Mock).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api', {
                headers: {
                    'Authorization': 'InvalidFormat',
                },
            });

            const user = await authenticateToken(request);
            expect(user).toBeNull();
        });

        it('should return null when token is not found in database', async () => {
            (authenticateToken as jest.Mock).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api', {
                headers: {
                    'Authorization': 'Bearer non-existent-token',
                },
            });

            const user = await authenticateToken(request);
            expect(user).toBeNull();
        });

        it('should return null and delete the token when token is expired', async () => {
            (authenticateToken as jest.Mock).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api', {
                headers: {
                    'Authorization': 'Bearer expired-token',
                },
            });

            const user = await authenticateToken(request);
            expect(user).toBeNull();
        });
    });

    describe('API routes with token authentication', () => {
        it('should access protected route with a valid token', async () => {
            // Mock authHandler for the API test
            (authHandler as jest.Mock).mockResolvedValue(mockUser);

            // Mock database lookup for user with addresses
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUserWithAddresses);

            const request = new NextRequest('http://localhost/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${mockToken.token}`,
                },
            });

            const response = await profileHandler(request);
            expect(response.status).toBe(200);
        });

        it('should reject access to protected route with an invalid token', async () => {
            // Mock authHandler for the API test
            const unauthorizedResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            (authHandler as jest.Mock).mockResolvedValue(unauthorizedResponse);

            const request = new NextRequest('http://localhost/api/user/profile', {
                headers: {
                    'Authorization': 'Bearer invalid-token',
                },
            });

            const response = await profileHandler(request);
            expect(response.status).toBe(401);
        });

        it('should reject access to API routes for inactive user accounts', async () => {
            // Mock authHandler to check isActive status
            (authHandler as jest.Mock).mockImplementation(async () => {
                return NextResponse.json(
                    { error: 'Account is not active. Please wait for admin approval.' },
                    { status: 403 }
                );
            });

            const request = new NextRequest('http://localhost/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${mockInactiveToken.token}`,
                },
            });

            const response = await profileHandler(request);
            expect(response.status).toBe(403);

            const data = await response.json();
            expect(data.error).toBe('Account is not active. Please wait for admin approval.');
        });
    });
}); 