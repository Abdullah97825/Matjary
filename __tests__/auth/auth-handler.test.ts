import { NextRequest, NextResponse } from 'next/server';
import { authHandler, isActiveAccount } from '@/lib/auth-handler';
import { authenticateToken } from '@/lib/token-auth';
import { getCurrentUser } from '@/lib/auth';

// Mock dependencies
jest.mock('@/lib/token-auth', () => ({
    authenticateToken: jest.fn()
}));

jest.mock('@/lib/auth', () => ({
    getCurrentUser: jest.fn()
}));

describe('Auth Handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isActiveAccount function', () => {
        it('should return the user object if the account is active', () => {
            const mockUser = {
                id: 'user1',
                name: 'Test User',
                email: 'test@example.com',
                role: 'CUSTOMER',
                isActive: true
            };

            const result = isActiveAccount(mockUser);
            expect(result).toBe(mockUser);
        });

        it('should return error response if account is inactive', () => {
            const mockUser = {
                id: 'user1',
                name: 'Test User',
                email: 'test@example.com',
                role: 'CUSTOMER',
                isActive: false
            };

            const result = isActiveAccount(mockUser);
            expect(result).toBeInstanceOf(NextResponse);
            expect(result.status).toBe(403);
        });
    });

    describe('authHandler function', () => {
        it('should authenticate with token and check isActive', async () => {
            const mockUser = {
                id: 'user1',
                email: 'test@example.com',
                role: 'CUSTOMER',
                isActive: true
            };

            (authenticateToken as jest.Mock).mockResolvedValue(mockUser);

            const request = new NextRequest('http://localhost/api', {
                headers: {
                    'Authorization': 'Bearer valid-token'
                }
            });

            const result = await authHandler(request);
            expect(result).toEqual(mockUser);
        });

        it('should authenticate with cookie and check isActive', async () => {
            const mockUser = {
                id: 'user1',
                email: 'test@example.com',
                role: 'CUSTOMER',
                isActive: true
            };

            (authenticateToken as jest.Mock).mockResolvedValue(null);
            (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

            const request = new NextRequest('http://localhost/api');

            const result = await authHandler(request);
            expect(result).toEqual(mockUser);
        });

        it('should return 403 for inactive account', async () => {
            const mockInactiveUser = {
                id: 'user1',
                email: 'test@example.com',
                role: 'CUSTOMER',
                isActive: false
            };

            (authenticateToken as jest.Mock).mockResolvedValue(mockInactiveUser);

            const request = new NextRequest('http://localhost/api', {
                headers: {
                    'Authorization': 'Bearer valid-token'
                }
            });

            const result = await authHandler(request);
            expect(result).toBeInstanceOf(NextResponse);
            expect(result.status).toBe(403);

            const data = await result.json();
            expect(data.error).toBe('Account is not active. Please wait for admin approval.');
        });

        it('should return 401 if no authentication method succeeds', async () => {
            (authenticateToken as jest.Mock).mockResolvedValue(null);
            (getCurrentUser as jest.Mock).mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api');

            const result = await authHandler(request);
            expect(result).toBeInstanceOf(NextResponse);
            expect(result.status).toBe(401);

            const data = await result.json();
            expect(data.error).toBe('Unauthorized');
        });
    });
}); 