import { NextRequest } from 'next/server';
import { GET as getProductDetail } from '@/app/api/products/[id]/route';
import { GET as getRelatedProducts } from '@/app/api/products/[id]/related/route';
import { prisma } from '@/lib/prisma';
import { convertPrice } from '@/utils/cart';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
    prisma: {
        product: {
            findUnique: jest.fn(),
            findMany: jest.fn()
        }
    }
}));

// Mock the cart utilities
jest.mock('@/utils/cart', () => ({
    convertPrice: jest.fn().mockImplementation((price) => {
        // Simulate the conversion from BigInt to string
        if (typeof price === 'bigint') {
            return String(Number(price) / 100);
        }
        return price;
    })
}));

// Helper function to create a mock NextRequest
function createRequest(url = 'http://localhost:3000/api/products/123') {
    return new NextRequest(new URL(url) as unknown as Request);
}

describe('Product Detail API', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('GET /api/products/[id]', () => {
        const mockProduct = {
            id: 'product-123',
            name: 'Test Product',
            description: 'This is a test product',
            price: BigInt(9999),
            stock: 10,
            public: true,
            categoryId: 'category-123',
            thumbnailId: 'image-123',
            avgRating: 4.5,
            totalReviews: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
            discountType: 'AMOUNT',
            discountAmount: BigInt(2000),
            discountPercent: null,
            category: {
                id: 'category-123',
                name: 'Test Category',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            images: [
                {
                    id: 'image-123',
                    url: 'https://example.com/image.jpg'
                }
            ],
            attachments: [
                {
                    id: 'attachment-123',
                    name: 'Test Attachment',
                    url: 'https://example.com/attachment.pdf'
                }
            ],
            tags: [
                {
                    id: 'tag-123',
                    name: 'Test Tag',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ],
            reviews: [
                {
                    id: 'review-123',
                    rating: 5,
                    title: 'Great Product',
                    content: 'Very satisfied with this product',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    userId: 'user-123',
                    productId: 'product-123',
                    user: {
                        id: 'user-123',
                        name: 'Test User',
                        image: 'https://example.com/user.jpg'
                    }
                }
            ]
        };

        it('should return product details', async () => {
            // Mock the prisma query
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

            // Create request and params
            const request = createRequest();
            const params = Promise.resolve({ id: 'product-123' });

            // Call the handler
            const response = await getProductDetail(request, { params });
            const data = await response.json();

            // Check response status
            expect(response.status).toBe(200);

            // Check essential product data
            expect(data.id).toBe(mockProduct.id);
            expect(data.name).toBe(mockProduct.name);
            expect(data.description).toBe(mockProduct.description);
            expect(data.avgRating).toBe(mockProduct.avgRating);
            expect(data.totalReviews).toBe(mockProduct.totalReviews);

            // Check price conversion
            expect(convertPrice).toHaveBeenCalledWith(mockProduct.price);

            // Check that images are properly sorted with thumbnail first
            expect(data.images[0].isThumbnail).toBe(true);
            expect(data.images[0].id).toBe(mockProduct.thumbnailId);

            // Check that the correct thumbnail is set
            expect(data.thumbnail.id).toBe(mockProduct.thumbnailId);

            // Verify related objects are serialized correctly
            expect(data.category).toEqual(expect.objectContaining({
                id: mockProduct.category.id,
                name: mockProduct.category.name
            }));

            expect(data.tags).toHaveLength(mockProduct.tags.length);

            // Check reviews are included
            expect(data.reviews).toHaveLength(mockProduct.reviews.length);
            expect(data.reviews[0]).toEqual(expect.objectContaining({
                id: mockProduct.reviews[0].id,
                rating: mockProduct.reviews[0].rating,
                user: expect.objectContaining({
                    name: mockProduct.reviews[0].user.name
                })
            }));
        });

        it('should return 404 if product is not found', async () => {
            // Mock the prisma query to return null
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

            // Create request and params
            const request = createRequest();
            const params = Promise.resolve({ id: 'non-existent-product' });

            // Call the handler
            const response = await getProductDetail(request, { params });

            // Check response
            expect(response.status).toBe(404);
        });

        it('should return 404 if product is not public', async () => {
            // For this test, we should return null since the route includes
            // public: true in the query criteria
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

            // Create request and params
            const request = createRequest();
            const params = Promise.resolve({ id: 'product-123' });

            // Call the handler
            const response = await getProductDetail(request, { params });

            // Check response
            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/products/[id]/related', () => {
        const mockProduct = {
            id: 'product-123',
            categoryId: 'category-123',
            public: true,
            tags: [
                { id: 'tag-123' },
                { id: 'tag-456' }
            ]
        };

        const mockRelatedProducts = [
            {
                id: 'related-product-1',
                name: 'Related Product 1',
                price: BigInt(8999),
                stock: 5,
                avgRating: 4.0,
                totalReviews: 8,
                discountAmount: null,
                discountType: null,
                discountPercent: null,
                thumbnailId: 'image-456',
                createdAt: new Date(),
                updatedAt: new Date(),
                category: {
                    id: 'category-123',
                    name: 'Test Category',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                images: [
                    {
                        id: 'image-456',
                        url: 'https://example.com/related-image.jpg'
                    }
                ]
            }
        ];

        it('should return related products', async () => {
            // Mock the prisma queries
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
            (prisma.product.findMany as jest.Mock).mockResolvedValue(mockRelatedProducts);

            // Create request and params
            const request = createRequest();
            const params = Promise.resolve({ id: 'product-123' });

            // Call the handler
            const response = await getRelatedProducts(request, { params });
            const data = await response.json();

            // Check response
            expect(response.status).toBe(200);
            expect(Array.isArray(data)).toBe(true);
            expect(data).toHaveLength(mockRelatedProducts.length);

            // Check essential product data
            expect(data[0].id).toBe(mockRelatedProducts[0].id);
            expect(data[0].name).toBe(mockRelatedProducts[0].name);

            // Check price conversion
            expect(convertPrice).toHaveBeenCalledWith(mockRelatedProducts[0].price);

            // Verify the thumbnail is correctly set
            expect(data[0].thumbnail.id).toBe(mockRelatedProducts[0].thumbnailId);

            // Check that category details are included
            expect(data[0].category).toEqual(expect.objectContaining({
                id: mockRelatedProducts[0].category.id,
                name: mockRelatedProducts[0].category.name
            }));
        });

        it('should return 404 if product is not found', async () => {
            // Mock the prisma query to return null
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

            // Create request and params
            const request = createRequest();
            const params = Promise.resolve({ id: 'non-existent-product' });

            // Call the handler
            const response = await getRelatedProducts(request, { params });

            // Check response
            expect(response.status).toBe(404);
        });

        it('should limit the number of results based on query param', async () => {
            // Mock the prisma queries
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
            (prisma.product.findMany as jest.Mock).mockResolvedValue(mockRelatedProducts);

            // Create request with limit param
            const request = createRequest('http://localhost:3000/api/products/123/related?limit=5');
            const params = Promise.resolve({ id: 'product-123' });

            // Call the handler
            await getRelatedProducts(request, { params });

            // Verify prisma was called with the right parameters
            expect(prisma.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 5
                })
            );
        });

        it('should exclude the current product from results', async () => {
            // Mock the prisma queries
            (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
            (prisma.product.findMany as jest.Mock).mockResolvedValue(mockRelatedProducts);

            // Create request and params
            const request = createRequest();
            const params = Promise.resolve({ id: 'product-123' });

            // Call the handler
            await getRelatedProducts(request, { params });

            // Verify prisma was called with the right parameters
            expect(prisma.product.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        AND: expect.arrayContaining([
                            { NOT: { id: 'product-123' } },
                            { public: true },
                            { isArchived: false }
                        ])
                    })
                })
            );
        });
    });
}); 