import { NextRequest, NextResponse } from 'next/server';
import { GET as getProfileHandler, PATCH as updateProfileHandler } from '@/app/api/user/profile/route';
import { PATCH as updatePasswordHandler } from '@/app/api/user/password/route';
import { GET as getAddressesHandler, POST as createAddressHandler } from '@/app/api/addresses/route';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { ZodError } from 'zod';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        address: {
            findMany: jest.fn(),
            create: jest.fn(),
            updateMany: jest.fn(),
        },
    },
}));

// Mock auth handler
jest.mock('@/lib/auth-handler', () => ({
    authHandler: jest.fn(),
}));

// Mock auth functions
jest.mock('@/lib/auth', () => ({
    verifyPassword: jest.fn(),
    hashPassword: jest.fn().mockResolvedValue('newHashedPassword'),
}));

// Mock zod
jest.mock('zod', () => {
    const actualZod = jest.requireActual('zod');
    return {
        ...actualZod,
        ZodError: actualZod.ZodError,
    };
});

describe('User API with both authentication methods', () => {
    const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Test User',
        phone: '+1234567890',
        password: 'hashedPassword123',
    };

    const mockAddresses = [
        {
            id: '1',
            userId: '1',
            country: 'Test Country',
            province: 'Test Province',
            city: 'Test City',
            neighbourhood: 'Test Neighbourhood',
            nearestLandmark: 'Test Landmark',
            zipcode: '12345',
            isDefault: true
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Profile API', () => {
        it('should get user profile with token authentication', async () => {
            // Mock successful token authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                ...mockUser,
                addresses: mockAddresses
            });

            const request = new NextRequest('http://localhost/api/user/profile', {
                headers: {
                    'Authorization': 'Bearer valid-token',
                },
            });

            const response = await getProfileHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('name', mockUser.name);
            expect(data).toHaveProperty('email', mockUser.email);
            expect(data).toHaveProperty('addresses');
        });

        it('should get user profile with cookie authentication', async () => {
            // Mock successful cookie authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                ...mockUser,
                addresses: mockAddresses
            });

            const request = new NextRequest('http://localhost/api/user/profile');

            const response = await getProfileHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('name', mockUser.name);
            expect(data).toHaveProperty('email', mockUser.email);
        });

        it('should update user profile successfully', async () => {
            const updatedData = {
                name: 'Updated Name',
                email: 'updated@example.com',
                phone: '+9876543210',
            };

            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock that email is not taken
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            // Mock successful update
            (prisma.user.update as jest.Mock).mockResolvedValue({
                ...mockUser,
                ...updatedData,
                addresses: mockAddresses
            });

            const request = new NextRequest('http://localhost/api/user/profile', {
                method: 'PATCH',
                body: JSON.stringify(updatedData),
            });

            const response = await updateProfileHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('name', updatedData.name);
            expect(data).toHaveProperty('email', updatedData.email);
        });

        it('should reject update with email already taken', async () => {
            const updatedData = {
                name: 'Updated Name',
                email: 'taken@example.com',
                phone: '+9876543210',
            };

            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock that email is taken
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '2' });

            const request = new NextRequest('http://localhost/api/user/profile', {
                method: 'PATCH',
                body: JSON.stringify(updatedData),
            });

            const response = await updateProfileHandler(request);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data).toHaveProperty('error', 'Email already taken');
        });

        it('should handle validation errors in profile update', async () => {
            const invalidData = {
                name: '', // Invalid: empty name
                email: 'not-an-email', // Invalid email
                phone: '123', // Invalid phone
            };

            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);

            const request = new NextRequest('http://localhost/api/user/profile', {
                method: 'PATCH',
                body: JSON.stringify(invalidData),
            });

            // This will actually invoke the real zod validation and fail
            const response = await updateProfileHandler(request);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data).toHaveProperty('error');
        });
    });

    describe('Password API', () => {
        it('should update password successfully', async () => {
            const passwordData = {
                currentPassword: 'CurrentPass123',
                password: 'NewPass123',
                passwordConfirmation: 'NewPass123'
            };

            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock successful password verification
            (verifyPassword as jest.Mock).mockResolvedValue(true);
            // Mock successful user update
            (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

            const request = new NextRequest('http://localhost/api/user/password', {
                method: 'PATCH',
                body: JSON.stringify(passwordData),
            });

            const response = await updatePasswordHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('message', 'Password updated successfully');
        });

        it('should reject with incorrect current password', async () => {
            const passwordData = {
                currentPassword: 'WrongPass123',
                password: 'NewPass123',
                passwordConfirmation: 'NewPass123'
            };

            // Mock successful authentication but password verification will fail
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock failed password verification
            (verifyPassword as jest.Mock).mockResolvedValue(false);

            const request = new NextRequest('http://localhost/api/user/password', {
                method: 'PATCH',
                body: JSON.stringify(passwordData),
                headers: {
                    'Authorization': 'Bearer valid-token',
                },
            });

            const response = await updatePasswordHandler(request);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data).toHaveProperty('error', 'Current password is incorrect');
        });

        it('should reject with mismatched password confirmation', async () => {
            const passwordData = {
                currentPassword: 'CurrentPass123',
                password: 'NewPass123',
                passwordConfirmation: 'DifferentPass123'
            };

            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);

            const request = new NextRequest('http://localhost/api/user/password', {
                method: 'PATCH',
                body: JSON.stringify(passwordData),
            });

            // This will actually invoke the real zod validation and fail
            const response = await updatePasswordHandler(request);
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data).toHaveProperty('error');
        });
    });

    describe('Addresses API', () => {
        it('should get user addresses', async () => {
            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock addresses retrieval
            (prisma.address.findMany as jest.Mock).mockResolvedValue(mockAddresses);

            const request = new NextRequest('http://localhost/api/addresses', {
                headers: {
                    'Authorization': 'Bearer valid-token',
                },
            });

            const response = await getAddressesHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(1);
            expect(data[0]).toHaveProperty('country', 'Test Country');
        });

        it('should create a new address', async () => {
            const newAddress = {
                country: 'New Country',
                province: 'New Province',
                city: 'New City',
                neighbourhood: 'New Neighbourhood',
                nearestLandmark: 'New Landmark',
                zipcode: '54321',
                isDefault: true,
            };

            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock address creation
            (prisma.address.create as jest.Mock).mockResolvedValue({
                id: '2',
                userId: '1',
                ...newAddress
            });

            const request = new NextRequest('http://localhost/api/addresses', {
                method: 'POST',
                body: JSON.stringify(newAddress),
            });

            const response = await createAddressHandler(request);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('country', newAddress.country);
            expect(data).toHaveProperty('isDefault', newAddress.isDefault);
        });

        it('should unset other default addresses when creating a new default', async () => {
            const newDefaultAddress = {
                country: 'Default Country',
                province: 'Default Province',
                city: 'Default City',
                neighbourhood: 'Default Neighbourhood',
                nearestLandmark: 'Default Landmark',
                zipcode: '11111',
                isDefault: true,
            };

            // Mock successful authentication
            (authHandler as jest.Mock).mockResolvedValue(mockUser);
            // Mock address creation
            (prisma.address.create as jest.Mock).mockResolvedValue({
                id: '3',
                userId: '1',
                ...newDefaultAddress
            });

            const request = new NextRequest('http://localhost/api/addresses', {
                method: 'POST',
                body: JSON.stringify(newDefaultAddress),
            });

            await createAddressHandler(request);

            // Verify that updateMany was called to unset other default addresses
            expect(prisma.address.updateMany).toHaveBeenCalledWith({
                where: {
                    userId: mockUser.id,
                    isDefault: true
                },
                data: { isDefault: false }
            });
        });
    });
}); 