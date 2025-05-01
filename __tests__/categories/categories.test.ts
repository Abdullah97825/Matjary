import { NextRequest, NextResponse } from "next/server";
import { GET as getCategories } from "@/app/api/categories/route";
import { GET as getCategoryById } from "@/app/api/categories/[id]/route";
import { prisma } from "@/lib/prisma";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
    prisma: {
        category: {
            findMany: jest.fn(),
            findUnique: jest.fn()
        }
    }
}));

describe("Categories API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/categories", () => {
        it("should return all active categories", async () => {
            // Mock data
            const mockCategories = [
                {
                    id: "cat1",
                    name: "Category 1",
                    slug: "category-1",
                    description: "Description 1",
                    imageUrl: "/images/cat1.jpg",
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    _count: { products: 5 }
                },
                {
                    id: "cat2",
                    name: "Category 2",
                    slug: "category-2",
                    description: "Description 2",
                    imageUrl: "/images/cat2.jpg",
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    _count: { products: 3 }
                }
            ];

            // Setup the mock
            (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

            // Create the request
            const req = new NextRequest(new URL("http://localhost/api/categories"));

            // Execute the handler
            const response = await getCategories(req);
            const data = await response.json();

            // Assertions
            expect(response.status).toBe(200);
            expect(data).toHaveLength(2);
            expect(data[0].id).toBe("cat1");
            expect(data[0].productCount).toBe(5);
            expect(data[1].id).toBe("cat2");
            expect(data[1].productCount).toBe(3);

            expect(prisma.category.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { active: true }
                })
            );
        });

        it("should include inactive categories when requested", async () => {
            // Mock data
            const mockCategories = [
                {
                    id: "cat1",
                    name: "Category 1",
                    slug: "category-1",
                    description: "Description 1",
                    imageUrl: "/images/cat1.jpg",
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    _count: { products: 5 }
                },
                {
                    id: "cat2",
                    name: "Category 2",
                    slug: "category-2",
                    description: "Description 2",
                    imageUrl: "/images/cat2.jpg",
                    active: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    _count: { products: 3 }
                }
            ];

            // Setup the mock
            (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

            // Create the request with includeInactive=true
            const req = new NextRequest(new URL("http://localhost/api/categories?includeInactive=true"));

            // Execute the handler
            const response = await getCategories(req);
            const data = await response.json();

            // Assertions
            expect(response.status).toBe(200);
            expect(data).toHaveLength(2);
            expect(data[0].active).toBe(true);
            expect(data[1].active).toBe(false);

            expect(prisma.category.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: undefined
                })
            );
        });
    });

    describe("GET /api/categories/[id]", () => {
        it("should return a category with its products", async () => {
            // Mock data for category with products
            const mockCategory = {
                id: "cat1",
                name: "Category 1",
                slug: "category-1",
                description: "Description 1",
                imageUrl: "/images/cat1.jpg",
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                _count: { products: 2 },
                products: [
                    {
                        id: "prod1",
                        name: "Product 1",
                        description: "Product description 1",
                        price: { toNumber: () => 99.99 },
                        stock: 10,
                        images: [{ id: "img1", url: "/images/prod1.jpg" }],
                        reviews: [{ rating: 4 }, { rating: 5 }]
                    },
                    {
                        id: "prod2",
                        name: "Product 2",
                        description: "Product description 2",
                        price: { toNumber: () => 149.99 },
                        stock: 5,
                        images: [{ id: "img2", url: "/images/prod2.jpg" }],
                        reviews: [{ rating: 3 }, { rating: 4 }, { rating: 5 }]
                    }
                ]
            };

            // Setup the mock
            (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);

            // Create the request
            const req = new NextRequest(new URL("http://localhost/api/categories/cat1"));

            // Execute the handler
            const response = await getCategoryById(req, { params: Promise.resolve({ id: "cat1" }) });
            const data = await response.json();

            // Assertions
            expect(response.status).toBe(200);
            expect(data.id).toBe("cat1");
            expect(data.name).toBe("Category 1");
            expect(data.productCount).toBe(2);
            expect(data.products).toHaveLength(2);

            // Check computed fields
            expect(data.products[0].avgRating).toBe(4.5);
            expect(data.products[0].totalReviews).toBe(2);
            expect(data.products[1].avgRating).toBe(4);
            expect(data.products[1].totalReviews).toBe(3);

            expect(prisma.category.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: "cat1" }
                })
            );
        });

        it("should return 404 if category not found", async () => {
            // Setup the mock to return null (category not found)
            (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

            // Create the request
            const req = new NextRequest(new URL("http://localhost/api/categories/non-existent"));

            // Execute the handler
            const response = await getCategoryById(req, { params: Promise.resolve({ id: "non-existent" }) });

            // Assertions
            expect(response.status).toBe(404);
            expect(await response.json()).toEqual({ error: "Category not found" });
        });
    });
}); 