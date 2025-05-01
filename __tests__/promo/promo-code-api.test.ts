import { NextRequest, NextResponse } from 'next/server';
import { GET as getAllPromoCodesHandler, POST as createPromoCodeHandler } from '@/app/api/admin/promo-codes/route';
import { GET as getPromoCodeHandler, PATCH as updatePromoCodeHandler, DELETE as deletePromoCodeHandler } from '@/app/api/admin/promo-codes/[id]/route';
import { GET as validatePromoCodeHandler } from '@/app/api/promo-codes/validate/route';
import { POST as applyPromoHandler } from '@/app/api/checkout/apply-promo/route';
import { POST as removePromoHandler } from '@/app/api/checkout/remove-promo/route';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';
import { DiscountType } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    prisma: {
        promoCode: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
        },
        userPromoCode: {
            create: jest.fn(),
            findMany: jest.fn(),
            deleteMany: jest.fn()
        },
        excludedUser: {
            create: jest.fn(),
            deleteMany: jest.fn()
        },
        order: {
            findUnique: jest.fn(),
            update: jest.fn()
        },
        cart: {
            findUnique: jest.fn()
        },
        review: {
            groupBy: jest.fn()
        },
        $transaction: jest.fn((callback) => callback(prisma))
    }
}));

// Mock auth handler
jest.mock('@/lib/auth-handler', () => ({
    authHandler: jest.fn()
}));

// Helper function to create mock context with params
const createMockContext = (id: string) => {
    return {
        params: Promise.resolve({ id })
    };
};

describe('Promo Code API', () => {
    // Mock users
    const mockAdminUser = {
        id: 'admin1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN'
    };

    const mockCustomerUser = {
        id: 'user1',
        name: 'Customer User',
        email: 'customer@example.com',
        role: 'CUSTOMER'
    };

    // Mock promo code data
    const mockPromoCode = {
        id: 'promo1',
        code: 'TESTCODE',
        description: 'Test promo code',
        discountType: 'PERCENTAGE' as DiscountType,
        discountAmount: null,
        discountPercent: 10,
        hasExpiryDate: true,
        expiryDate: new Date('2099-12-31'),
        isActive: true,
        maxUses: 100,
        usedCount: 5,
        minOrderAmount: 50,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        userAssignments: [],
        excludedUsers: [],
        orders: []
    };

    // Mock request creation
    const createMockRequest = (method: string, url: string, body?: any) => {
        const request = new NextRequest(url, { method });
        if (body) {
            request.json = jest.fn().mockResolvedValue(body);
        }
        return request;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (authHandler as jest.Mock).mockReset();
    });

    describe('Admin Promo Code API', () => {
        describe('GET /api/admin/promo-codes', () => {
            it('should return all promo codes for admin users', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Setup promo code mock data
                const mockPromoCodesList = [mockPromoCode];
                (prisma.promoCode.findMany as jest.Mock).mockResolvedValue(mockPromoCodesList);
                (prisma.promoCode.count as jest.Mock).mockResolvedValue(1);

                // Create request
                const req = createMockRequest('GET', 'http://localhost/api/admin/promo-codes');

                // Execute handler
                const response = await getAllPromoCodesHandler(req);
                const responseData = await response.json();

                // Verify response
                expect(response.status).toBe(200);
                expect(responseData).toHaveProperty('data');
                expect(responseData).toHaveProperty('meta');
                expect(Array.isArray(responseData.data)).toBe(true);
                expect(responseData.data.length).toBe(1);
                expect(responseData.data[0]).toHaveProperty('id', 'promo1');
                expect(responseData.data[0]).toHaveProperty('code', 'TESTCODE');
                expect(responseData.meta).toHaveProperty('current_page', 1);
                expect(responseData.meta).toHaveProperty('total', 1);
            });

            it('should return 403 for non-admin users', async () => {
                // Setup auth mock for customer user
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Create request
                const req = createMockRequest('GET', 'http://localhost/api/admin/promo-codes');

                // Execute handler
                const response = await getAllPromoCodesHandler(req);

                // Verify response
                expect(response.status).toBe(403);
            });

            it('should return 401 for unauthenticated requests', async () => {
                // Setup auth mock to simulate authentication failure
                (authHandler as jest.Mock).mockResolvedValue(new NextResponse(null, { status: 401 }));

                // Create request
                const req = createMockRequest('GET', 'http://localhost/api/admin/promo-codes');

                // Execute handler
                const response = await getAllPromoCodesHandler(req);

                // Verify response
                expect(response.status).toBe(401);
            });

            it('should handle database errors', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Setup prisma mock to throw error
                (prisma.promoCode.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

                // Create request
                const req = createMockRequest('GET', 'http://localhost/api/admin/promo-codes');

                // Execute handler
                const response = await getAllPromoCodesHandler(req);

                // Verify response
                expect(response.status).toBe(500);
            });
        });

        describe('POST /api/admin/promo-codes', () => {
            const newPromoCodeData = {
                code: 'NEWCODE',
                description: 'New promo code',
                discountType: 'FLAT',
                discountAmount: 20,
                discountPercent: null,
                hasExpiryDate: false,
                expiryDate: null,
                isActive: true,
                maxUses: null,
                minOrderAmount: null
            };

            it('should create a new promo code for admin users', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Setup prisma mocks
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValueOnce(null); // First call - check existing code
                (prisma.promoCode.create as jest.Mock).mockResolvedValueOnce({
                    id: 'newpromo1',
                    ...newPromoCodeData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                // Mock the second findUnique call after creation
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValueOnce({
                    id: 'newpromo1',
                    ...newPromoCodeData,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    userAssignments: [],
                    excludedUsers: [],
                    usedCount: 0
                });

                // Create request
                const req = createMockRequest('POST', 'http://localhost/api/admin/promo-codes', newPromoCodeData);

                // Execute handler
                const response = await createPromoCodeHandler(req);
                const data = await response.json();

                // Verify response
                expect(response.status).toBe(201);
                expect(data).toHaveProperty('id', 'newpromo1');
                expect(data).toHaveProperty('code', 'NEWCODE');
                expect(data).toHaveProperty('discountType', 'FLAT');
                expect(data).toHaveProperty('discountAmount', 20);
            });

            it('should return 400 if promo code already exists', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Setup prisma mock to return existing promo code
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({ id: 'existing', code: 'NEWCODE' });

                // Create request
                const req = createMockRequest('POST', 'http://localhost/api/admin/promo-codes', newPromoCodeData);

                // Execute handler
                const response = await createPromoCodeHandler(req);

                // Verify response
                expect(response.status).toBe(400);
                const data = await response.json();
                expect(data).toHaveProperty('error', 'Promo code already exists');
            });

            it('should return 400 for invalid input', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Create request with invalid data (missing required field)
                const req = createMockRequest('POST', 'http://localhost/api/admin/promo-codes', {
                    // Missing 'code' field which is required
                    discountType: 'FLAT',
                    discountAmount: 20
                });

                // Execute handler
                const response = await createPromoCodeHandler(req);

                // Verify response
                expect(response.status).toBe(400);
            });

            it('should return 403 for non-admin users', async () => {
                // Setup auth mock for customer user
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Create request
                const req = createMockRequest('POST', 'http://localhost/api/admin/promo-codes', newPromoCodeData);

                // Execute handler
                const response = await createPromoCodeHandler(req);

                // Verify response
                expect(response.status).toBe(403);
            });
        });

        describe('GET /api/admin/promo-codes/[id]', () => {
            it('should return a specific promo code for admin users', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Setup prisma mock
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue(mockPromoCode);

                // Create request and context
                const req = createMockRequest('GET', 'http://localhost/api/admin/promo-codes/promo1');
                const context = createMockContext('promo1');

                // Execute handler
                const response = await getPromoCodeHandler(req, context);
                const data = await response.json();

                // Verify response
                expect(response.status).toBe(200);
                expect(data).toHaveProperty('id', 'promo1');
                expect(data).toHaveProperty('code', 'TESTCODE');
            });

            it('should return 404 if promo code does not exist', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Setup prisma mock
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

                // Create request and context
                const req = createMockRequest('GET', 'http://localhost/api/admin/promo-codes/nonexistent');
                const context = createMockContext('nonexistent');

                // Execute handler
                const response = await getPromoCodeHandler(req, context);

                // Verify response
                expect(response.status).toBe(404);
            });

            it('should return 403 for non-admin users', async () => {
                // Setup auth mock for customer user
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Create request and context
                const req = createMockRequest('GET', 'http://localhost/api/admin/promo-codes/promo1');
                const context = createMockContext('promo1');

                // Execute handler
                const response = await getPromoCodeHandler(req, context);

                // Verify response
                expect(response.status).toBe(403);
            });
        });

        describe('PATCH /api/admin/promo-codes/[id]', () => {
            const updateData = {
                description: 'Updated description',
                discountPercent: 15,
                isActive: false
            };

            it('should update a promo code for admin users', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Setup prisma mocks
                // First call to findUnique to check if promo code exists
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValueOnce(mockPromoCode);

                // For the update operation in transaction
                (prisma.promoCode.update as jest.Mock).mockResolvedValueOnce({
                    ...mockPromoCode,
                    description: 'Updated description',
                    discountPercent: 15,
                    isActive: false
                });

                // For the final findUnique call after update
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValueOnce({
                    ...mockPromoCode,
                    description: 'Updated description',
                    discountPercent: 15,
                    isActive: false,
                    userAssignments: [],
                    excludedUsers: []
                });

                // Create request and context
                const req = createMockRequest('PATCH', 'http://localhost/api/admin/promo-codes/promo1', updateData);
                const context = createMockContext('promo1');

                // Execute handler
                const response = await updatePromoCodeHandler(req, context);
                const data = await response.json();

                // Verify response
                expect(response.status).toBe(200);
                expect(data).toHaveProperty('id', 'promo1');
                expect(data).toHaveProperty('description', 'Updated description');
                expect(data).toHaveProperty('discountPercent', 15);
                expect(data).toHaveProperty('isActive', false);
            });

            it('should return 404 if promo code does not exist', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Setup prisma mock
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

                // Create request and context
                const req = createMockRequest('PATCH', 'http://localhost/api/admin/promo-codes/nonexistent', updateData);
                const context = createMockContext('nonexistent');

                // Execute handler
                const response = await updatePromoCodeHandler(req, context);

                // Verify response
                expect(response.status).toBe(404);
            });

            it('should return 400 when updating code to one that already exists', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Setup prisma mocks
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValueOnce(mockPromoCode); // For initial find
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'different', code: 'NEWCODE' }); // For code check

                // Create request and context with code update
                const req = createMockRequest('PATCH', 'http://localhost/api/admin/promo-codes/promo1', {
                    code: 'NEWCODE'
                });
                const context = createMockContext('promo1');

                // Execute handler
                const response = await updatePromoCodeHandler(req, context);

                // Verify response
                expect(response.status).toBe(400);
                const data = await response.json();
                expect(data).toHaveProperty('error', 'Promo code already exists');
            });

            it('should return 403 for non-admin users', async () => {
                // Setup auth mock for customer user
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Create request and context
                const req = createMockRequest('PATCH', 'http://localhost/api/admin/promo-codes/promo1', updateData);
                const context = createMockContext('promo1');

                // Execute handler
                const response = await updatePromoCodeHandler(req, context);

                // Verify response
                expect(response.status).toBe(403);
            });
        });

        describe('DELETE /api/admin/promo-codes/[id]', () => {
            it('should delete a promo code for admin users', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Setup prisma mocks
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
                    ...mockPromoCode,
                    orders: []
                });

                // Create request and context
                const req = createMockRequest('DELETE', 'http://localhost/api/admin/promo-codes/promo1');
                const context = createMockContext('promo1');

                // Execute handler
                const response = await deletePromoCodeHandler(req, context);
                const data = await response.json();

                // Verify response
                expect(response.status).toBe(200);
                expect(data).toHaveProperty('success', true);

                // Verify delete calls
                expect(prisma.userPromoCode.deleteMany).toHaveBeenCalled();
                expect(prisma.excludedUser.deleteMany).toHaveBeenCalled();
                expect(prisma.promoCode.delete).toHaveBeenCalled();
            });

            it('should return 404 if promo code does not exist', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Setup prisma mock
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

                // Create request and context
                const req = createMockRequest('DELETE', 'http://localhost/api/admin/promo-codes/nonexistent');
                const context = createMockContext('nonexistent');

                // Execute handler
                const response = await deletePromoCodeHandler(req, context);

                // Verify response
                expect(response.status).toBe(404);
            });

            it('should return 400 if promo code has been used in orders', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

                // Setup prisma mock with promo code that has orders
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue({
                    ...mockPromoCode,
                    orders: [{ id: 'order1' }]
                });

                // Create request and context
                const req = createMockRequest('DELETE', 'http://localhost/api/admin/promo-codes/promo1');
                const context = createMockContext('promo1');

                // Execute handler
                const response = await deletePromoCodeHandler(req, context);

                // Verify response
                expect(response.status).toBe(400);
                const data = await response.json();
                expect(data).toHaveProperty('error', 'Cannot delete promo code that has been used in orders');
            });

            it('should return 403 for non-admin users', async () => {
                // Setup auth mock for customer user
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Create request and context
                const req = createMockRequest('DELETE', 'http://localhost/api/admin/promo-codes/promo1');
                const context = createMockContext('promo1');

                // Execute handler
                const response = await deletePromoCodeHandler(req, context);

                // Verify response
                expect(response.status).toBe(403);
            });
        });
    });

    describe('Customer Promo Code API', () => {
        describe('GET /api/promo-codes/validate', () => {
            const mockOrder = {
                id: 'order1',
                userId: 'user1',
                items: [
                    { price: 30, quantity: 2 },
                    { price: 10, quantity: 1 }
                ]
            };

            const mockCart = {
                id: 'cart1',
                userId: 'user1',
                items: [
                    {
                        product: { price: 30 },
                        quantity: 2
                    },
                    {
                        product: { price: 10 },
                        quantity: 1
                    }
                ]
            };

            it('should validate a promo code for authenticated users with order total', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks
                (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue(mockPromoCode);
                (prisma.userPromoCode.findMany as jest.Mock).mockResolvedValue([]);

                // Create mocked URL with query params
                const url = new URL('http://localhost/api/promo-codes/validate');
                url.searchParams.append('code', 'TESTCODE');
                url.searchParams.append('orderId', 'order1');

                // Create request
                const req = new NextRequest(url);

                // Execute handler
                const response = await validatePromoCodeHandler(req);
                const data = await response.json();

                // Verify response
                expect(response.status).toBe(200);
                expect(data).toHaveProperty('isValid', true);
                expect(data).toHaveProperty('code');
                expect(data).toHaveProperty('discount');
                expect(data.discount).toHaveProperty('type', 'PERCENTAGE');
                expect(data.discount).toHaveProperty('percent', 10);
            });

            it('should validate a promo code using cart total when no order is specified', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks
                (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue(mockPromoCode);
                (prisma.userPromoCode.findMany as jest.Mock).mockResolvedValue([]);

                // Create mocked URL with query params
                const url = new URL('http://localhost/api/promo-codes/validate');
                url.searchParams.append('code', 'TESTCODE');

                // Create request
                const req = new NextRequest(url);

                // Execute handler
                const response = await validatePromoCodeHandler(req);
                const data = await response.json();

                // Verify response
                expect(response.status).toBe(200);
                expect(data).toHaveProperty('isValid', true);
            });

            it('should return validation failure for invalid promo code', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks - no promo code found
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null);

                // Create mocked URL with query params
                const url = new URL('http://localhost/api/promo-codes/validate');
                url.searchParams.append('code', 'INVALID');

                // Create request
                const req = new NextRequest(url);

                // Execute handler
                const response = await validatePromoCodeHandler(req);
                const data = await response.json();

                // Verify response
                expect(response.status).toBe(200);
                expect(data).toHaveProperty('isValid', false);
                expect(data).toHaveProperty('message', 'Invalid or inactive promo code');
            });

            it('should return 400 if no code is provided', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Create mocked URL with no code param
                const url = new URL('http://localhost/api/promo-codes/validate');

                // Create request
                const req = new NextRequest(url);

                // Execute handler
                const response = await validatePromoCodeHandler(req);

                // Verify response
                expect(response.status).toBe(400);
                const data = await response.json();
                expect(data).toHaveProperty('isValid', false);
                expect(data).toHaveProperty('message', 'Promo code is required');
            });

            it('should return 404 if the specified order is not found', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks - no order found
                (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

                // Create mocked URL with query params
                const url = new URL('http://localhost/api/promo-codes/validate');
                url.searchParams.append('code', 'TESTCODE');
                url.searchParams.append('orderId', 'nonexistent');

                // Create request
                const req = new NextRequest(url);

                // Execute handler
                const response = await validatePromoCodeHandler(req);

                // Verify response
                expect(response.status).toBe(404);
                const data = await response.json();
                expect(data).toHaveProperty('isValid', false);
                expect(data).toHaveProperty('message', 'Order not found');
            });
        });

        describe('POST /api/checkout/apply-promo', () => {
            const mockOrder = {
                id: 'order1',
                userId: 'user1',
                items: [
                    { price: 30, quantity: 2 },
                    { price: 10, quantity: 1 }
                ],
                promoCodeId: null
            };

            it('should apply a valid promo code to an order', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks
                (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue(mockPromoCode);
                (prisma.userPromoCode.findMany as jest.Mock).mockResolvedValue([]);

                // Create request
                const req = createMockRequest('POST', 'http://localhost/api/checkout/apply-promo', {
                    code: 'TESTCODE',
                    orderId: 'order1'
                });

                // Execute handler
                const response = await applyPromoHandler(req);
                const data = await response.json();

                // Verify response
                expect(response.status).toBe(200);
                expect(data).toHaveProperty('id', 'promo1');
                expect(data).toHaveProperty('code', 'TESTCODE');
                expect(data).toHaveProperty('discountAmount');

                // Verify order update call
                expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
                    where: { id: 'order1' },
                    data: expect.objectContaining({
                        promoCodeId: 'promo1'
                    })
                }));
            });

            it('should return 400 if order already has a promo code', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks - order with existing promo code
                (prisma.order.findUnique as jest.Mock).mockResolvedValue({
                    ...mockOrder,
                    promoCodeId: 'existing-promo'
                });

                // Create request
                const req = createMockRequest('POST', 'http://localhost/api/checkout/apply-promo', {
                    code: 'TESTCODE',
                    orderId: 'order1'
                });

                // Execute handler
                const response = await applyPromoHandler(req);

                // Verify response
                expect(response.status).toBe(400);
                const data = await response.json();
                expect(data).toHaveProperty('error', 'Order already has a promo code applied. Remove it first before applying a new one.');
            });

            it('should return 404 if order does not exist', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks - no order found
                (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

                // Create request
                const req = createMockRequest('POST', 'http://localhost/api/checkout/apply-promo', {
                    code: 'TESTCODE',
                    orderId: 'nonexistent'
                });

                // Execute handler
                const response = await applyPromoHandler(req);

                // Verify response
                expect(response.status).toBe(404);
            });

            it('should return 403 if user does not own the order', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks - order belonging to a different user
                (prisma.order.findUnique as jest.Mock).mockResolvedValue({
                    ...mockOrder,
                    userId: 'different-user'
                });

                // Create request
                const req = createMockRequest('POST', 'http://localhost/api/checkout/apply-promo', {
                    code: 'TESTCODE',
                    orderId: 'order1'
                });

                // Execute handler
                const response = await applyPromoHandler(req);

                // Verify response
                expect(response.status).toBe(403);
            });

            it('should return 400 if promo code validation fails', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks
                (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
                (prisma.promoCode.findUnique as jest.Mock).mockResolvedValue(null); // Invalid promo code

                // Create request
                const req = createMockRequest('POST', 'http://localhost/api/checkout/apply-promo', {
                    code: 'INVALID',
                    orderId: 'order1'
                });

                // Execute handler
                const response = await applyPromoHandler(req);

                // Verify response
                expect(response.status).toBe(400);
                const data = await response.json();
                expect(data).toHaveProperty('error', 'Invalid or inactive promo code');
            });
        });

        describe('POST /api/checkout/remove-promo', () => {
            const mockOrder = {
                id: 'order1',
                userId: 'user1',
                promoCodeId: 'promo1'
            };

            it('should remove a promo code from an order', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks
                (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

                // Create request
                const req = createMockRequest('POST', 'http://localhost/api/checkout/remove-promo', {
                    orderId: 'order1'
                });

                // Execute handler
                const response = await removePromoHandler(req);
                const data = await response.json();

                // Verify response
                expect(response.status).toBe(200);
                expect(data).toHaveProperty('success', true);

                // Verify order update call
                expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
                    where: { id: 'order1' },
                    data: expect.objectContaining({
                        promoCodeId: null,
                        promoDiscount: null
                    })
                }));
            });

            it('should return 404 if order does not exist', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks - no order found
                (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

                // Create request
                const req = createMockRequest('POST', 'http://localhost/api/checkout/remove-promo', {
                    orderId: 'nonexistent'
                });

                // Execute handler
                const response = await removePromoHandler(req);

                // Verify response
                expect(response.status).toBe(404);
            });

            it('should return 403 if user does not own the order', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks - order belonging to a different user
                (prisma.order.findUnique as jest.Mock).mockResolvedValue({
                    ...mockOrder,
                    userId: 'different-user'
                });

                // Create request
                const req = createMockRequest('POST', 'http://localhost/api/checkout/remove-promo', {
                    orderId: 'order1'
                });

                // Execute handler
                const response = await removePromoHandler(req);

                // Verify response
                expect(response.status).toBe(403);
            });

            it('should return 400 if order does not have a promo code applied', async () => {
                // Setup auth mock
                (authHandler as jest.Mock).mockResolvedValue(mockCustomerUser);

                // Setup prisma mocks - order with no promo code
                (prisma.order.findUnique as jest.Mock).mockResolvedValue({
                    ...mockOrder,
                    promoCodeId: null
                });

                // Create request
                const req = createMockRequest('POST', 'http://localhost/api/checkout/remove-promo', {
                    orderId: 'order1'
                });

                // Execute handler
                const response = await removePromoHandler(req);

                // Verify response
                expect(response.status).toBe(400);
                const data = await response.json();
                expect(data).toHaveProperty('error', 'Order does not have a promo code applied');
            });
        });
    });
}); 