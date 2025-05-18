import { NextRequest, NextResponse } from 'next/server';
import { GET, PATCH } from '@/app/api/admin/customers/[id]/route';
import { GET as getCustomersHandler } from '@/app/api/admin/customers/route';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn()
        }
    }
}));

// Mock auth handler
jest.mock('@/lib/auth-handler', () => ({
    authHandler: jest.fn()
}));

describe('Admin Customer Activation API', () => {
    const mockAdmin = {
        id: 'admin1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN'
    };

    const mockCustomer = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'CUSTOMER',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        addresses: [],
        orders: []
    };

    const mockCustomers = [
        {
            id: 'user1',
            name: 'Test User',
            email: 'test@example.com',
            phone: '+1234567890',
            role: 'CUSTOMER',
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { orders: 2 },
            orders: []
        },
        {
            id: 'user2',
            name: 'Active User',
            email: 'active@example.com',
            phone: '+9876543210',
            role: 'CUSTOMER',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { orders: 5 },
            orders: []
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (authHandler as jest.Mock).mockResolvedValue(mockAdmin);
    });

    describe('PATCH /api/admin/customers/[id]', () => {
        it('should activate a customer account', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCustomer);
            (prisma.user.update as jest.Mock).mockResolvedValue({
                ...mockCustomer,
                isActive: true
            });

            const request = new NextRequest(
                'http://localhost/api/admin/customers/user1',
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ isActive: true })
                }
            );

            const context = { params: Promise.resolve({ id: 'user1' }) };
            const response = await PATCH(request, context);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.isActive).toBe(true);
            expect(data.message).toBe('User account activated');

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user1' },
                data: { isActive: true },
                select: { id: true, isActive: true }
            });
        });

        it('should deactivate a customer account', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                ...mockCustomer,
                isActive: true
            });
            (prisma.user.update as jest.Mock).mockResolvedValue({
                ...mockCustomer,
                isActive: false
            });

            const request = new NextRequest(
                'http://localhost/api/admin/customers/user1',
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ isActive: false })
                }
            );

            const context = { params: Promise.resolve({ id: 'user1' }) };
            const response = await PATCH(request, context);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.isActive).toBe(false);
            expect(data.message).toBe('User account deactivated');
        });

        it('should return 401 if user is not an admin', async () => {
            (authHandler as jest.Mock).mockResolvedValue({
                id: 'user2',
                name: 'Regular User',
                email: 'user@example.com',
                role: 'CUSTOMER'
            });

            const request = new NextRequest(
                'http://localhost/api/admin/customers/user1',
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ isActive: true })
                }
            );

            const context = { params: Promise.resolve({ id: 'user1' }) };
            const response = await PATCH(request, context);

            expect(response.status).toBe(401);
        });

        it('should validate request body', async () => {
            const request = new NextRequest(
                'http://localhost/api/admin/customers/user1',
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ someInvalidProperty: true })
                }
            );

            const context = { params: Promise.resolve({ id: 'user1' }) };
            const response = await PATCH(request, context);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/admin/customers', () => {
        it('should filter customers by active status', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(1);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([mockCustomers[0]]);

            const request = new NextRequest(
                'http://localhost/api/admin/customers?active=false'
            );

            await getCustomersHandler(request);

            // Check that the correct filter was applied
            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        isActive: false
                    })
                })
            );
        });

        it('should filter customers by active=true', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(1);
            (prisma.user.findMany as jest.Mock).mockResolvedValue([mockCustomers[1]]);

            const request = new NextRequest(
                'http://localhost/api/admin/customers?active=true'
            );

            await getCustomersHandler(request);

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        isActive: true
                    })
                })
            );
        });

        it('should return all customers when no active filter is specified', async () => {
            (prisma.user.count as jest.Mock).mockResolvedValue(2);
            (prisma.user.findMany as jest.Mock).mockResolvedValue(mockCustomers);

            const request = new NextRequest(
                'http://localhost/api/admin/customers'
            );

            await getCustomersHandler(request);

            // Check that no isActive filter was applied
            const whereClause = (prisma.user.findMany as jest.Mock).mock.calls[0][0].where;
            expect(whereClause.isActive).toBeUndefined();
        });
    });

    describe('GET /api/admin/customers/[id]', () => {
        it('should include isActive in customer details', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCustomer);

            const request = new NextRequest(
                'http://localhost/api/admin/customers/user1'
            );

            const context = { params: Promise.resolve({ id: 'user1' }) };
            const response = await GET(request, context);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveProperty('isActive', false);
        });
    });
}); 