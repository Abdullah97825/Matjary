import { NextRequest, NextResponse } from 'next/server';
import { PATCH as archiveProduct } from '@/app/api/admin/products/[id]/archive/route';
import { PATCH as unarchiveProduct } from '@/app/api/admin/products/[id]/unarchive/route';
import { prisma } from '@/lib/prisma';
import { authHandler } from '@/lib/auth-handler';

// Mock the auth handler
jest.mock('@/lib/auth-handler', () => ({
    authHandler: jest.fn()
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        product: {
            findUnique: jest.fn(),
            update: jest.fn()
        },
        orderItem: {
            findMany: jest.fn()
        },
        cartItem: {
            deleteMany: jest.fn()
        }
    }
}));

describe('Admin Product Archive/Unarchive API', () => {
    const mockAdminUser = {
        id: 'admin-user-id',
        role: 'ADMIN'
    };

    const mockProductId = 'product-id-123';

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default auth response
        (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

        // Setup default product
        (prisma.product.findUnique as jest.Mock).mockResolvedValue({
            id: mockProductId,
            name: 'Test Product',
            isArchived: false
        });

        // Setup default product update
        (prisma.product.update as jest.Mock).mockImplementation((args) => {
            return Promise.resolve({
                ...args.data,
                id: mockProductId,
                name: 'Test Product'
            });
        });

        // Setup default empty order items
        (prisma.orderItem.findMany as jest.Mock).mockResolvedValue([]);

        // Setup default cart items deletion
        (prisma.cartItem.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    });

    describe('Archive Product', () => {
        it('should archive a product successfully', async () => {
            // Create the request
            const req = new NextRequest('http://localhost/api/admin/products/123/archive', {
                method: 'PATCH'
            });

            // Execute the handler
            const params = Promise.resolve({ id: mockProductId });
            const response = await archiveProduct(req, { params });
            const data = await response.json();

            // Assertions
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            // Check the correct product is archived
            expect(prisma.product.update).toHaveBeenCalledWith({
                where: { id: mockProductId },
                data: { isArchived: true }
            });

            // Ensure cart items are deleted
            expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
                where: { productId: mockProductId }
            });
        });

        it('should return a warning when product is in pending orders', async () => {
            // Setup orders with this product
            (prisma.orderItem.findMany as jest.Mock).mockResolvedValue([
                { order: { id: 'order-1' } },
                { order: { id: 'order-2' } }
            ]);

            // Create the request
            const req = new NextRequest('http://localhost/api/admin/products/123/archive', {
                method: 'PATCH'
            });

            // Execute the handler
            const params = Promise.resolve({ id: mockProductId });
            const response = await archiveProduct(req, { params });
            const data = await response.json();

            // Assertions
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.warning).toBeTruthy();
            expect(data.affectedOrders).toEqual(['order-1', 'order-2']);
        });

        it('should return 401 unauthorized for non-admin users', async () => {
            // Setup unauthorized user
            (authHandler as jest.Mock).mockResolvedValue({
                id: 'regular-user',
                role: 'USER'
            });

            // Create the request
            const req = new NextRequest('http://localhost/api/admin/products/123/archive', {
                method: 'PATCH'
            });

            // Execute the handler
            const params = Promise.resolve({ id: mockProductId });
            const response = await archiveProduct(req, { params });

            // Assertions
            expect(response.status).toBe(401);
        });
    });

    describe('Unarchive Product', () => {
        it('should unarchive a product successfully', async () => {
            // Setup archived product
            (prisma.product.findUnique as jest.Mock).mockResolvedValue({
                id: mockProductId,
                name: 'Test Product',
                isArchived: true
            });

            // Create the request
            const req = new NextRequest('http://localhost/api/admin/products/123/unarchive', {
                method: 'PATCH'
            });

            // Execute the handler
            const params = Promise.resolve({ id: mockProductId });
            const response = await unarchiveProduct(req, { params });
            const data = await response.json();

            // Assertions
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            // Check the correct product is unarchived
            expect(prisma.product.update).toHaveBeenCalledWith({
                where: { id: mockProductId },
                data: { isArchived: false }
            });
        });

        it('should return 401 unauthorized for non-admin users', async () => {
            // Setup unauthorized user
            (authHandler as jest.Mock).mockResolvedValue({
                id: 'regular-user',
                role: 'USER'
            });

            // Create the request
            const req = new NextRequest('http://localhost/api/admin/products/123/unarchive', {
                method: 'PATCH'
            });

            // Execute the handler
            const params = Promise.resolve({ id: mockProductId });
            const response = await unarchiveProduct(req, { params });

            // Assertions
            expect(response.status).toBe(401);
        });
    });
}); 