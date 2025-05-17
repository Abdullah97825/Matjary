import { NextRequest, NextResponse } from 'next/server';
import { GET as getCartHandler, DELETE as clearCartHandler } from '@/app/api/cart/route';
import { POST as addCartItemHandler, DELETE as removeCartItemHandler, PATCH as updateCartItemHandler } from '@/app/api/cart/items/route';
import { POST as createOrderHandler } from '@/app/api/orders/route';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        cart: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        cartItem: {
            create: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
        product: {
            findUnique: jest.fn(),
        },
        order: {
            create: jest.fn(),
        },
        address: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        settings: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        },
        $transaction: jest.fn(async (callback) => {
            // If it's a function, handle the transaction with proper order number mocking
            if (typeof callback === 'function') {
                const tx = {
                    order: {
                        create: jest.fn().mockResolvedValue({
                            id: '1',
                            orderSequenceNumber: 1
                        }),
                        update: jest.fn().mockResolvedValue({
                            id: '1',
                            orderSequenceNumber: 1,
                            orderNumber: 'O-1'
                        })
                    }
                };
                return await callback(tx);
            }
            return { id: '1', orderNumber: 'O-1' };
        }),
    },
}));

// Mock auth handler
jest.mock('@/lib/auth-handler', () => ({
    authHandler: jest.fn(),
}));

describe('Cart and Orders API with both authentication methods', () => {
    const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        phone: '+1234567890',
    };

    const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 10.99,
        stock: 100,
        discountType: null,
        discountAmount: null,
        discountPercent: null,
        public: true,
        negotiablePrice: false,
        hidePrice: false,
        images: [{ id: '1', url: '/uploads/images/test.jpg' }],
        thumbnailId: '1',
        thumbnail: { id: '1', url: '/uploads/images/test.jpg' },
    };

    const mockCartItem = {
        id: '1',
        cartId: '1',
        productId: '1',
        quantity: 2,
        product: mockProduct,
    };

    const mockCart = {
        id: '1',
        userId: '1',
        items: [mockCartItem],
    };

    const mockAddress = {
        id: '1',
        userId: '1',
        country: 'Test Country',
        province: 'Test Province',
        city: 'Test City',
        neighbourhood: 'Test Neighbourhood',
        nearestLandmark: 'Test Landmark',
        zipcode: '12345',
        isDefault: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Cart API', () => {
        it('should get cart with token authentication', async () => {
            // Mock successful token authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock cart retrieval
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

            const request = new NextRequest('http://localhost/api/cart', {
                headers: {
                    'Authorization': 'Bearer valid-token',
                },
            });

            const response = await getCartHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('items');
            expect(data).toHaveProperty('subtotal');
        });

        it('should reject cart access with invalid authentication', async () => {
            // Mock failed authentication
            const unauthorizedResponse = NextResponse.json(
                { error: 'Unauthorized', items: [], subtotal: 0 },
                { status: 401 }
            );
            (authHandler as jest.Mock).mockResolvedValue(unauthorizedResponse);

            const request = new NextRequest('http://localhost/api/cart');

            const response = await getCartHandler(request);
            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data).toHaveProperty('error', 'Unauthorized');
        });

        it('should add item to cart successfully', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock product retrieval
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
            // Mock cart retrieval and creation
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
            // Mock cart item creation
            (prisma.cartItem.create as jest.Mock).mockResolvedValue(mockCartItem);
            (prisma.cartItem.update as jest.Mock).mockResolvedValue(mockCartItem);

            // Reset the transaction mock for cart operations
            (prisma.$transaction as jest.Mock).mockImplementationOnce((callback) => {
                if (typeof callback === 'function') {
                    return callback({
                        product: {
                            findUnique: jest.fn().mockResolvedValue(mockProduct)
                        },
                        cart: {
                            findUnique: jest.fn().mockResolvedValue(mockCart),
                            create: jest.fn().mockResolvedValue(mockCart)
                        },
                        cartItem: {
                            create: jest.fn().mockResolvedValue(mockCartItem),
                            findFirst: jest.fn().mockResolvedValue(null),
                            update: jest.fn().mockResolvedValue(mockCartItem)
                        }
                    });
                }
                return mockCartItem;
            });

            const request = new NextRequest('http://localhost/api/cart/items', {
                method: 'POST',
                body: JSON.stringify({
                    productId: '1',
                    quantity: 2,
                }),
            });

            const response = await addCartItemHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('message', 'Item added to cart successfully');
            expect(data).toHaveProperty('items');
        });

        it('should update cart item quantity', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock cart item retrieval
            (prisma.cartItem.findFirst as jest.Mock).mockResolvedValue({
                ...mockCartItem,
                product: mockProduct,
            });
            // Mock cart item findUnique for schema validation
            (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue({
                ...mockCartItem,
                product: mockProduct,
            });
            // Mock cart retrieval
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

            const request = new NextRequest('http://localhost/api/cart/items?itemId=1', {
                method: 'PATCH',
                body: JSON.stringify({
                    quantity: 3,
                }),
            });

            const response = await updateCartItemHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('message', 'Cart item updated successfully');
        });

        it('should remove item from cart', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock cart item retrieval
            (prisma.cartItem.findFirst as jest.Mock).mockResolvedValue(mockCartItem);
            // Mock cart retrieval
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

            const request = new NextRequest('http://localhost/api/cart/items?itemId=1', {
                method: 'DELETE',
            });

            const response = await removeCartItemHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('message', 'Item removed from cart');
        });

        it('should clear the entire cart', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock cart retrieval
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

            const request = new NextRequest('http://localhost/api/cart', {
                method: 'DELETE',
            });

            const response = await clearCartHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('message', 'Cart cleared successfully');
        });
    });

    describe('Orders API', () => {
        it('should create order with existing address', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock address retrieval
            (prisma.address.findUnique as jest.Mock).mockResolvedValue(mockAddress);
            // Mock cart retrieval
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
            // Mock settings for order prefix
            (prisma.settings.findUnique as jest.Mock).mockResolvedValue({
                id: 'setting1',
                slug: 'order_prefix',
                name: 'Order Prefix',
                value: 'O',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify({
                    addressId: '1',
                    paymentMethod: 'CASH',
                    requestDetails: false
                }),
                headers: {
                    'Authorization': 'Bearer valid-token',
                },
            });

            const response = await createOrderHandler(request);
            expect(response.status).toBe(200);

            // Parse the response text to handle any format issues
            const responseText = await response.text();
            const data = JSON.parse(responseText);

            expect(data).toHaveProperty('orderId', '1');

            // Verify settings were looked up
            expect(prisma.settings.findUnique).toHaveBeenCalledWith({
                where: { slug: 'order_prefix' }
            });

            // Verify transaction was used
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('should create order with new address', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock cart retrieval
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
            // Mock address creation
            (prisma.address.create as jest.Mock).mockResolvedValue({
                ...mockAddress,
                id: '2'
            });
            // Mock settings for order prefix
            (prisma.settings.findUnique as jest.Mock).mockResolvedValue({
                id: 'setting1',
                slug: 'order_prefix',
                name: 'Order Prefix',
                value: 'O',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const newAddress = {
                country: 'New Country',
                province: 'New Province',
                city: 'New City',
                neighbourhood: 'New Neighbourhood',
                nearestLandmark: 'New Landmark',
                zipcode: '54321',
            };

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify({
                    newAddress,
                    saveAddress: true,
                    paymentMethod: 'CASH',
                    requestDetails: false
                }),
                headers: {
                    'Authorization': 'Bearer valid-token',
                },
            });

            const response = await createOrderHandler(request);
            expect(response.status).toBe(200);

            // Parse the response text to handle any format issues
            const responseText = await response.text();
            const data = JSON.parse(responseText);

            expect(data).toHaveProperty('orderId', '1');

            // Verify address was created
            expect(prisma.address.create).toHaveBeenCalled();

            // Verify settings were looked up
            expect(prisma.settings.findUnique).toHaveBeenCalledWith({
                where: { slug: 'order_prefix' }
            });

            // Verify transaction was used
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('should create order with negotiable price items', async () => {
            // Create a cart with negotiable items
            const negotiableCart = {
                ...mockCart,
                items: [{
                    ...mockCartItem,
                    product: {
                        ...mockProduct,
                        negotiablePrice: true
                    }
                }]
            };

            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock address retrieval
            (prisma.address.findUnique as jest.Mock).mockResolvedValue(mockAddress);
            // Mock cart retrieval with negotiable items
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue(negotiableCart);
            // Mock settings for order prefix
            (prisma.settings.findUnique as jest.Mock).mockResolvedValue({
                id: 'setting1',
                slug: 'order_prefix',
                name: 'Order Prefix',
                value: 'O',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            // Update transaction mock for admin pending status
            (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
                if (typeof callback === 'function') {
                    const tx = {
                        order: {
                            create: jest.fn().mockResolvedValue({
                                id: '1',
                                orderSequenceNumber: 1,
                                status: 'ADMIN_PENDING'
                            }),
                            update: jest.fn().mockResolvedValue({
                                id: '1',
                                orderSequenceNumber: 1,
                                orderNumber: 'O-1',
                                status: 'ADMIN_PENDING'
                            })
                        }
                    };
                    return await callback(tx);
                }
                return {
                    id: '1',
                    orderNumber: 'O-1',
                    status: 'ADMIN_PENDING'
                };
            });

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify({
                    addressId: '1',
                    paymentMethod: 'PENDING',
                    requestDetails: true
                }),
                headers: {
                    'Authorization': 'Bearer valid-token',
                },
            });

            const response = await createOrderHandler(request);
            expect(response.status).toBe(200);

            // Parse the response text to handle any format issues
            const responseText = await response.text();
            const data = JSON.parse(responseText);

            expect(data).toHaveProperty('orderId', '1');

            // Verify settings were looked up
            expect(prisma.settings.findUnique).toHaveBeenCalledWith({
                where: { slug: 'order_prefix' }
            });

            // Verify transaction was used
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it('should reject order creation with empty cart', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock empty cart
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                userId: '1',
                items: [],
            });

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify({
                    addressId: '1',
                    paymentMethod: 'CASH',
                }),
            });

            const response = await createOrderHandler(request);
            expect(response.status).toBe(400);
        });

        it('should reject order with insufficient stock', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock address retrieval
            (prisma.address.findUnique as jest.Mock).mockResolvedValue(mockAddress);
            // Mock cart with product that has insufficient stock
            (prisma.cart.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                userId: '1',
                items: [{
                    id: '1',
                    cartId: '1',
                    productId: '1',
                    quantity: 1000, // More than available stock
                    product: mockProduct,
                }],
            });

            const request = new NextRequest('http://localhost/api/orders', {
                method: 'POST',
                body: JSON.stringify({
                    addressId: '1',
                    paymentMethod: 'CASH',
                }),
            });

            const response = await createOrderHandler(request);
            expect(response.status).toBe(400);
        });
    });
}); 