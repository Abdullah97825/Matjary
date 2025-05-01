import { NextRequest, NextResponse } from 'next/server';
import { GET as getDashboardHandler } from '@/app/api/admin/dashboard/route';
import { GET as getProductsHandler } from '@/app/api/admin/products/route';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        product: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        order: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
        user: {
            count: jest.fn(),
        },
    },
}));

// Mock auth handler
jest.mock('@/lib/auth-handler', () => ({
    authHandler: jest.fn(),
}));

describe('Admin API Authentication', () => {
    const mockAdmin = {
        id: '1',
        role: 'ADMIN',
        email: 'admin@example.com',
        name: 'Admin User',
    };

    const mockCustomer = {
        id: '2',
        role: 'CUSTOMER',
        email: 'customer@example.com',
        name: 'Customer User',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Dashboard API', () => {
        beforeEach(() => {
            // Setup default mocks for dashboard data
            (prisma.product.count as jest.Mock).mockResolvedValue(10);
            (prisma.order.count as jest.Mock).mockResolvedValue(5);
            (prisma.user.count as jest.Mock).mockResolvedValue(20);
            (prisma.order.findMany as jest.Mock).mockResolvedValue([]);
        });

        it('should allow access with admin token authentication', async () => {
            // Mock admin authentication
            (authHandler as jest.Mock).mockResolvedValue(mockAdmin);

            const request = new NextRequest('http://localhost/api/admin/dashboard', {
                headers: {
                    'Authorization': 'Bearer admin-token',
                },
            });

            const response = await getDashboardHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('totalProducts', 10);
            expect(data).toHaveProperty('totalOrders', 5);
            expect(data).toHaveProperty('totalCustomers', 20);
        });

        it('should reject access with non-admin token authentication', async () => {
            // Mock customer authentication (non-admin)
            (authHandler as jest.Mock).mockResolvedValue(mockCustomer);

            const request = new NextRequest('http://localhost/api/admin/dashboard', {
                headers: {
                    'Authorization': 'Bearer customer-token',
                },
            });

            const response = await getDashboardHandler(request);
            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data).toHaveProperty('error', 'Unauthorized');
        });

        it('should reject access with invalid token', async () => {
            // Mock failed authentication
            const unauthorizedResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            (authHandler as jest.Mock).mockResolvedValue(unauthorizedResponse);

            const request = new NextRequest('http://localhost/api/admin/dashboard', {
                headers: {
                    'Authorization': 'Bearer invalid-token',
                },
            });

            const response = await getDashboardHandler(request);
            expect(response.status).toBe(401);
        });
    });

    describe('Products API', () => {
        beforeEach(() => {
            // Setup default mocks for products data
            (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.product.count as jest.Mock).mockResolvedValue(0);
        });

        it('should allow access with admin token authentication', async () => {
            // Mock admin authentication
            (authHandler as jest.Mock).mockResolvedValue(mockAdmin);

            const request = new NextRequest('http://localhost/api/admin/products');

            const response = await getProductsHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('data');
            expect(data).toHaveProperty('meta');
        });

        it('should reject access with non-admin token authentication', async () => {
            // Mock customer authentication (non-admin)
            (authHandler as jest.Mock).mockResolvedValue(mockCustomer);

            const request = new NextRequest('http://localhost/api/admin/products');

            const response = await getProductsHandler(request);
            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data).toHaveProperty('error', 'Unauthorized');
        });

        it('should reject access with invalid token', async () => {
            // Mock failed authentication
            const unauthorizedResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            (authHandler as jest.Mock).mockResolvedValue(unauthorizedResponse);

            const request = new NextRequest('http://localhost/api/admin/products');

            const response = await getProductsHandler(request);
            expect(response.status).toBe(401);
        });
    });
}); 