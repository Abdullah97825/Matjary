import { NextRequest } from 'next/server';
import { POST as uploadImage } from '@/app/api/admin/products/upload/route';
import { POST as uploadAttachment } from '@/app/api/admin/products/attachment/route';
import { DELETE as deleteImage } from '@/app/api/admin/products/upload/[filename]/route';
import { DELETE as deleteAttachment } from '@/app/api/admin/products/attachment/[filename]/route';
import { PATCH as updateThumbnail } from '@/app/api/admin/products/[id]/thumbnail/route';
import { prisma } from '@/lib/prisma';
import { authHandler } from '@/lib/auth-handler';
import { saveProductImage, saveProductAttachment, deleteProductImage, deleteProductAttachment } from '@/lib/upload';

// Mock dependencies
jest.mock('@/lib/auth-handler', () => ({
    authHandler: jest.fn()
}));

jest.mock('@/lib/upload', () => ({
    saveProductImage: jest.fn(),
    saveProductAttachment: jest.fn(),
    deleteProductImage: jest.fn(),
    deleteProductAttachment: jest.fn()
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {
        product: {
            findUnique: jest.fn(),
            update: jest.fn()
        },
        productImage: {
            create: jest.fn(),
            findFirst: jest.fn(),
            deleteMany: jest.fn()
        },
        productAttachment: {
            create: jest.fn(),
            findFirst: jest.fn(),
            deleteMany: jest.fn()
        },
        temporaryUpload: {
            create: jest.fn()
        }
    }
}));

describe('Admin Product Media Operations', () => {
    const mockAdminUser = { id: 'admin-id', role: 'ADMIN' };
    const mockArchivedProductId = 'archived-product-id';
    const mockActiveProductId = 'active-product-id';
    const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

    beforeEach(() => {
        jest.clearAllMocks();

        // Default auth response
        (authHandler as jest.Mock).mockResolvedValue(mockAdminUser);

        // Mock upload functions
        (saveProductImage as jest.Mock).mockResolvedValue('/uploads/images/test.jpg');
        (saveProductAttachment as jest.Mock).mockResolvedValue({
            url: '/uploads/attachments/test.pdf',
            name: 'test.pdf'
        });
        (deleteProductImage as jest.Mock).mockResolvedValue({ fileDeleted: true });
        (deleteProductAttachment as jest.Mock).mockResolvedValue({ fileDeleted: true });

        // Mock prisma functions
        (prisma.product.findUnique as jest.Mock).mockImplementation((args) => {
            if (args.where.id === mockArchivedProductId) {
                return Promise.resolve({ id: mockArchivedProductId, isArchived: true });
            }
            return Promise.resolve({ id: mockActiveProductId, isArchived: false });
        });

        (prisma.productImage.findFirst as jest.Mock).mockImplementation((args) => {
            if (args.where.url.includes('archived')) {
                return Promise.resolve({
                    id: 'image-id',
                    url: args.where.url,
                    product: { id: mockArchivedProductId, isArchived: true }
                });
            }
            return Promise.resolve({
                id: 'image-id',
                url: args.where.url,
                product: { id: mockActiveProductId, isArchived: false }
            });
        });

        (prisma.productAttachment.findFirst as jest.Mock).mockImplementation((args) => {
            if (args.where.url.includes('archived')) {
                return Promise.resolve({
                    id: 'attachment-id',
                    url: args.where.url,
                    product: { id: mockArchivedProductId, isArchived: true }
                });
            }
            return Promise.resolve({
                id: 'attachment-id',
                url: args.where.url,
                product: { id: mockActiveProductId, isArchived: false }
            });
        });

        (prisma.productImage.create as jest.Mock).mockResolvedValue({ id: 'new-image-id' });
        (prisma.productAttachment.create as jest.Mock).mockResolvedValue({ id: 'new-attachment-id' });
        (prisma.productImage.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
        (prisma.productAttachment.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
        (prisma.temporaryUpload.create as jest.Mock).mockResolvedValue({});
        (prisma.product.update as jest.Mock).mockImplementation((args) => {
            return Promise.resolve({
                id: args.where.id,
                ...args.data,
                thumbnailId: args.data.thumbnailId
            });
        });
    });

    describe('Image Upload', () => {
        it('should reject uploads to archived products', async () => {
            // Create form data with archived product ID
            const formData = new FormData();
            formData.append('file', mockFile);
            formData.append('productId', mockArchivedProductId);

            // Create request
            const request = new NextRequest('http://localhost/api/admin/products/upload', {
                method: 'POST',
                body: formData
            });

            // Call the handler
            const response = await uploadImage(request);
            const data = await response.json();

            // Assertions
            expect(response.status).toBe(400);
            expect(data.error).toContain('Cannot modify archived products');

            // Verify the image was not created in the database
            expect(prisma.productImage.create).not.toHaveBeenCalled();
        });

        it('should allow uploads to active products', async () => {
            // Create form data with active product ID
            const formData = new FormData();
            formData.append('file', mockFile);
            formData.append('productId', mockActiveProductId);

            // Create request
            const request = new NextRequest('http://localhost/api/admin/products/upload', {
                method: 'POST',
                body: formData
            });

            // Call the handler
            const response = await uploadImage(request);

            // Assertions
            expect(response.status).toBe(200);

            // Verify the image was created in the database
            expect(prisma.productImage.create).toHaveBeenCalledWith({
                data: {
                    url: '/uploads/images/test.jpg',
                    product: {
                        connect: {
                            id: mockActiveProductId
                        }
                    }
                }
            });
        });
    });

    describe('Attachment Upload', () => {
        it('should reject uploads to archived products', async () => {
            // Create form data with archived product ID
            const formData = new FormData();
            formData.append('file', mockFile);
            formData.append('productId', mockArchivedProductId);

            // Create request
            const request = new NextRequest('http://localhost/api/admin/products/attachment', {
                method: 'POST',
                body: formData
            });

            // Call the handler
            const response = await uploadAttachment(request);
            const data = await response.json();

            // Assertions
            expect(response.status).toBe(400);
            expect(data.error).toContain('Cannot modify archived products');

            // Verify the attachment was not created in the database
            expect(prisma.productAttachment.create).not.toHaveBeenCalled();
        });

        it('should allow uploads to active products', async () => {
            // Create form data with active product ID
            const formData = new FormData();
            formData.append('file', mockFile);
            formData.append('productId', mockActiveProductId);

            // Create request
            const request = new NextRequest('http://localhost/api/admin/products/attachment', {
                method: 'POST',
                body: formData
            });

            // Call the handler
            const response = await uploadAttachment(request);

            // Assertions
            expect(response.status).toBe(200);

            // Verify the attachment was created in the database
            expect(prisma.productAttachment.create).toHaveBeenCalledWith({
                data: {
                    url: '/uploads/attachments/test.pdf',
                    name: 'test.pdf',
                    product: { connect: { id: mockActiveProductId } }
                }
            });
        });
    });

    describe('Image Deletion', () => {
        it('should reject deleting images from archived products', async () => {
            // Setup a product with archived status
            (prisma.productImage.findFirst as jest.Mock).mockResolvedValue({
                id: 'image-id',
                url: '/uploads/images/archived-image.jpg',
                product: { id: mockArchivedProductId, isArchived: true }
            });

            // Create request
            const request = new NextRequest('http://localhost/api/admin/products/upload/archived-image.jpg', {
                method: 'DELETE'
            });

            // Call the handler
            const params = Promise.resolve({ filename: 'archived-image.jpg' });
            const response = await deleteImage(request, { params });
            const data = await response.json();

            // Assertions
            expect(response.status).toBe(400);
            expect(data.error).toContain('Cannot modify archived products');

            // Verify no deletion occurred
            expect(prisma.productImage.deleteMany).not.toHaveBeenCalled();
        });

        it('should allow deleting images from active products', async () => {
            // Create request
            const request = new NextRequest('http://localhost/api/admin/products/upload/active-image.jpg', {
                method: 'DELETE'
            });

            // Call the handler
            const params = Promise.resolve({ filename: 'active-image.jpg' });
            const response = await deleteImage(request, { params });

            // Assertions
            expect(response.status).toBe(200);

            // Verify deletion occurred
            expect(prisma.productImage.deleteMany).toHaveBeenCalled();
        });
    });

    describe('Attachment Deletion', () => {
        it('should reject deleting attachments from archived products', async () => {
            // Setup a product with archived status
            (prisma.productAttachment.findFirst as jest.Mock).mockResolvedValue({
                id: 'attachment-id',
                url: '/uploads/attachments/archived-file.pdf',
                product: { id: mockArchivedProductId, isArchived: true }
            });

            // Create request
            const request = new NextRequest('http://localhost/api/admin/products/attachment/archived-file.pdf', {
                method: 'DELETE'
            });

            // Call the handler
            const params = Promise.resolve({ filename: 'archived-file.pdf' });
            const response = await deleteAttachment(request, { params });
            const data = await response.json();

            // Assertions
            expect(response.status).toBe(400);
            expect(data.error).toContain('Cannot modify archived products');

            // Verify no deletion occurred
            expect(prisma.productAttachment.deleteMany).not.toHaveBeenCalled();
        });

        it('should allow deleting attachments from active products', async () => {
            // Create request
            const request = new NextRequest('http://localhost/api/admin/products/attachment/active-file.pdf', {
                method: 'DELETE'
            });

            // Call the handler
            const params = Promise.resolve({ filename: 'active-file.pdf' });
            const response = await deleteAttachment(request, { params });

            // Assertions
            expect(response.status).toBe(200);

            // Verify deletion occurred
            expect(prisma.productAttachment.deleteMany).toHaveBeenCalled();
        });
    });

    describe('Thumbnail Update', () => {
        it('should reject updating thumbnail for archived products', async () => {
            // Create request
            const request = new NextRequest('http://localhost/api/admin/products/' + mockArchivedProductId + '/thumbnail', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ thumbnailId: 'new-thumbnail-id' })
            });

            // Call the handler
            const params = Promise.resolve({ id: mockArchivedProductId });
            const response = await updateThumbnail(request, { params });
            const data = await response.json();

            // Assertions
            expect(response.status).toBe(400);
            expect(data.error).toContain('Cannot modify archived products');

            // Verify no update occurred
            expect(prisma.product.update).not.toHaveBeenCalled();
        });

        it('should allow updating thumbnail for active products', async () => {
            // Create request
            const request = new NextRequest('http://localhost/api/admin/products/' + mockActiveProductId + '/thumbnail', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ thumbnailId: 'new-thumbnail-id' })
            });

            // Call the handler
            const params = Promise.resolve({ id: mockActiveProductId });
            const response = await updateThumbnail(request, { params });

            // Assertions
            expect(response.status).toBe(200);

            // Verify update occurred
            expect(prisma.product.update).toHaveBeenCalledWith({
                where: { id: mockActiveProductId },
                data: { thumbnailId: 'new-thumbnail-id' },
                include: {
                    images: true,
                    thumbnail: true
                }
            });
        });
    });
}); 