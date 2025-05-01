import { NextRequest } from 'next/server';
import { GET } from '@/app/api/products/featured/route';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        product: {
            findMany: jest.fn()
        }
    }
}));

describe('Featured Products API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return featured products', async () => {
        // Mock data
        const mockProducts = [
            {
                id: 'prod1',
                name: 'Featured Product 1',
                description: 'Description 1',
                price: { toNumber: () => 99.99 },
                stock: 10,
                public: true,
                isFeatured: true,
                categoryId: 'cat1',
                thumbnailId: 'img1',
                discountAmount: null,
                category: {
                    id: 'cat1',
                    name: 'Category 1',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                images: [
                    { id: 'img1', url: '/images/prod1.jpg' }
                ],
                thumbnail: null,
                reviews: [{ rating: 4 }, { rating: 5 }],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'prod2',
                name: 'Featured Product 2',
                description: 'Description 2',
                price: { toNumber: () => 149.99 },
                stock: 5,
                public: true,
                isFeatured: true,
                categoryId: 'cat2',
                thumbnailId: 'img2',
                discountAmount: { toNumber: () => 20.00 },
                category: {
                    id: 'cat2',
                    name: 'Category 2',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                images: [
                    { id: 'img2', url: '/images/prod2.jpg' }
                ],
                thumbnail: null,
                reviews: [{ rating: 3 }, { rating: 4 }, { rating: 5 }],
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Setup the mock
        (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

        // Create the request
        const req = new NextRequest(new URL('http://localhost/api/products/featured'));

        // Execute the handler
        const response = await GET(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(200);
        expect(data).toHaveLength(2);

        // Check first product
        expect(data[0].id).toBe('prod1');
        expect(data[0].name).toBe('Featured Product 1');
        expect(data[0].avgRating).toBe(4.5);
        expect(data[0].totalReviews).toBe(2);

        // Check second product
        expect(data[1].id).toBe('prod2');
        expect(data[1].name).toBe('Featured Product 2');
        expect(data[1].avgRating).toBe(4);
        expect(data[1].totalReviews).toBe(3);
        expect(data[1].discountAmount).toBe(20);

        // Verify the correct query was made
        expect(prisma.product.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    public: true,
                    isFeatured: true,
                    isArchived: false
                },
                take: 10 // Default limit updated to 10
            })
        );
    });

    it('should respect the limit parameter', async () => {
        // Setup the mock to return an empty array (we don't care about the actual products for this test)
        (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

        // Create the request with limit=3
        const req = new NextRequest(new URL('http://localhost/api/products/featured?limit=3'));

        // Execute the handler
        await GET(req);

        // Verify the correct limit was used
        expect(prisma.product.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                take: 3
            })
        );
    });

    it('should handle errors and return 500 status', async () => {
        // Setup the mock to throw an error
        (prisma.product.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

        // Create the request
        const req = new NextRequest(new URL('http://localhost/api/products/featured'));

        // Execute the handler
        const response = await GET(req);
        const data = await response.json();

        // Assertions
        expect(response.status).toBe(500);
        expect(data).toEqual({ error: 'Failed to fetch featured products' });
    });
}); 