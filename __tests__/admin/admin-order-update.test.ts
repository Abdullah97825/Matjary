import { NextRequest, NextResponse } from 'next/server';
import { PATCH as updateOrderHandler } from '@/app/api/admin/orders/[id]/update/route';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/auth-handler');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        order: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        orderItem: {
            update: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
        product: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        orderStatusHistory: {
            create: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(prisma)),
    },
}));

// Helper function to create request context
const createMockContext = (orderId: string) => ({
    params: Promise.resolve({ id: orderId }),
});

describe('Admin Order Update API', () => {
    const mockAdminUser = {
        id: 'admin1',
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '1234567890',
        role: 'ADMIN',
    };

    const mockOrder = {
        id: 'order1',
        status: 'PENDING',
        recipientName: 'Test User',
        phone: '1234567890',
        shippingAddress: '123 Test St, Test City',
        paymentMethod: 'CASH',
        savings: 10.00,
        adminDiscount: null,
        adminDiscountReason: null,
        itemsEdited: false,
        items: [],
        user: {
            id: 'user1',
            name: 'Test User',
            email: 'test@example.com',
        },
    };

    beforeEach(() => {
        jest.resetAllMocks();
        (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);
        (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
        (prisma.order.update as jest.Mock).mockImplementation((args) => {
            return {
                ...mockOrder,
                ...args.data,
            };
        });
    });

    describe('PATCH /api/admin/orders/[id]/update', () => {
        it('should update admin discount successfully', async () => {
            // Create request
            const req = new NextRequest(
                new URL('http://localhost/api/admin/orders/order1/update'),
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        adminDiscount: 15.99,
                        adminDiscountReason: 'Special customer discount',
                    }),
                }
            );
            const context = createMockContext('order1');

            // Execute handler
            const response = await updateOrderHandler(req, context);
            const data = await response.json();

            // Verify response
            expect(response.status).toBe(200);

            // Verify order update was called with correct data
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'order1' },
                    data: expect.objectContaining({
                        adminDiscount: 15.99,
                        adminDiscountReason: 'Special customer discount',
                    }),
                })
            );
        });

        it('should clear admin discount when set to null', async () => {
            // Create a mock order with existing discount
            const orderWithDiscount = {
                ...mockOrder,
                adminDiscount: 20.00,
                adminDiscountReason: 'Previous discount',
            };

            (prisma.order.findUnique as jest.Mock).mockResolvedValue(orderWithDiscount);

            // Create request
            const req = new NextRequest(
                new URL('http://localhost/api/admin/orders/order1/update'),
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        adminDiscount: null,
                        adminDiscountReason: null,
                    }),
                }
            );
            const context = createMockContext('order1');

            // Execute handler
            const response = await updateOrderHandler(req, context);
            const data = await response.json();

            // Verify response
            expect(response.status).toBe(200);

            // Verify order update was called with correct data
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'order1' },
                    data: expect.objectContaining({
                        adminDiscount: null,
                        adminDiscountReason: null,
                    }),
                })
            );
        });

        it('should update admin discount while also changing order status', async () => {
            // Create request
            const req = new NextRequest(
                new URL('http://localhost/api/admin/orders/order1/update'),
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        adminDiscount: 25.50,
                        adminDiscountReason: 'Loyalty discount',
                        status: 'ACCEPTED',
                    }),
                }
            );
            const context = createMockContext('order1');

            // Execute handler
            const response = await updateOrderHandler(req, context);
            const data = await response.json();

            // Verify response
            expect(response.status).toBe(200);

            // Verify order update was called with correct data
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'order1' },
                    data: expect.objectContaining({
                        adminDiscount: 25.50,
                        adminDiscountReason: 'Loyalty discount',
                        status: 'ACCEPTED',
                    }),
                })
            );

            // Verify history was created
            expect(prisma.orderStatusHistory.create).toHaveBeenCalled();
        });

        it('should reject discount with negative value', async () => {
            // Create request with invalid discount
            const req = new NextRequest(
                new URL('http://localhost/api/admin/orders/order1/update'),
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        adminDiscount: -10.00,
                        adminDiscountReason: 'Invalid negative discount',
                    }),
                }
            );
            const context = createMockContext('order1');

            // Execute handler
            const response = await updateOrderHandler(req, context);

            // Verify response
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data).toHaveProperty('error', 'Invalid request data');
        });

        it('should reject unauthorized requests', async () => {
            // Setup mock for non-admin user
            (authHandler as jest.Mock).mockResolvedValue({
                id: 'user1',
                name: 'Regular User',
                role: 'CUSTOMER',
            });

            // Create request
            const req = new NextRequest(
                new URL('http://localhost/api/admin/orders/order1/update'),
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        adminDiscount: 15.00,
                    }),
                }
            );
            const context = createMockContext('order1');

            // Execute handler
            const response = await updateOrderHandler(req, context);

            // Verify response
            expect(response.status).toBe(401);
        });
    });
}); 