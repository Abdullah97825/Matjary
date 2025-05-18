import { NextRequest, NextResponse } from 'next/server';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { GET as profileHandler, PATCH as updateProfileHandler } from '@/app/api/user/profile/route';
import { PATCH as updatePasswordHandler } from '@/app/api/user/password/route';
import { prisma } from '@/lib/prisma';
import { hashPassword, getCurrentUser, verifyPassword } from '@/lib/auth';
import { authHandler } from '@/lib/auth-handler';
import { authenticateToken } from '@/lib/token-auth';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    personalAccessToken: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock auth utilities
jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// Mock token auth utilities
jest.mock('@/lib/token-auth', () => ({
  authenticateToken: jest.fn(),
}));

// Mock auth handler
jest.mock('@/lib/auth-handler', () => ({
  authHandler: jest.fn(),
}));

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        passwordConfirmation: 'Password123',
        name: 'Test User',
        phone: '+1234567890',
        address: {
          country: 'Test Country',
          province: 'Test Province',
          city: 'Test City',
          neighbourhood: 'Test Neighbourhood',
          nearestLandmark: 'Test Landmark',
          zipcode: '12345',
          isDefault: true
        }
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashedPassword123');
      (prisma.user.create as jest.Mock).mockResolvedValue({ ...userData, id: 1 });

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const response = await registerHandler(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.message).toBe('User registered successfully. Your account will be reviewed by an administrator.');

      // Ensure isActive is set to false during registration
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false
          })
        })
      );
    });

    it('should reject invalid registration data', async () => {
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: '123',
          name: 'A',
        }),
      });

      const response = await registerHandler(request);
      expect(response.status).toBe(400);
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123',
        passwordConfirmation: 'Password123',
        name: 'Test User',
        phone: '+1234567890',
        address: {
          country: 'Test Country',
          province: 'Test Province',
          city: 'Test City',
          neighbourhood: 'Test Neighbourhood',
          nearestLandmark: 'Test Landmark',
          zipcode: '12345',
          isDefault: true
        }
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const response = await registerHandler(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Email already registered');
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await hashPassword('Password123');
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true, // User is active
        role: 'CUSTOMER'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (prisma.session.create as jest.Mock).mockResolvedValue({
        id: 1,
        token: 'test-token'
      });

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123',
        }),
      });

      const response = await loginHandler(request);
      expect(response.status).toBe(200);

      const cookies = response.headers.get('set-cookie');
      expect(cookies).toBeTruthy();
    });

    it('should reject inactive user accounts', async () => {
      const hashedPassword = await hashPassword('Password123');
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        isActive: false, // User is inactive
        role: 'CUSTOMER'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123',
        }),
      });

      const response = await loginHandler(request);
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe('Your account is not active. Please contact an administrator.');
    });

    it('should allow admin users to login regardless of isActive status', async () => {
      const hashedPassword = await hashPassword('Password123');
      const mockUser = {
        id: 1,
        email: 'admin@example.com',
        password: hashedPassword,
        isActive: false, // Inactive, but admin user
        role: 'ADMIN'
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (prisma.session.create as jest.Mock).mockResolvedValue({
        id: 1,
        token: 'test-token'
      });

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'Password123',
        }),
      });

      const response = await loginHandler(request);
      expect(response.status).toBe(200);

      const cookies = response.headers.get('set-cookie');
      expect(cookies).toBeTruthy();
    });

    it('should reject invalid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'wrong@example.com',
          password: 'WrongPass123',
        }),
      });

      const response = await loginHandler(request);
      expect(response.status).toBe(401);
    });
  });

  describe('Profile Management', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      phone: '+1234567890',
      address: {
        country: 'Test Country',
        province: 'Test Province',
        city: 'Test City',
        neighbourhood: 'Test Neighbourhood',
        nearestLandmark: 'Test Landmark',
        zipcode: '12345',
        isDefault: true
      }
    };

    // Define mockAddresses array for testing
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
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should get user profile', async () => {
      // Mock the user returned by authHandler
      (authHandler as jest.Mock).mockResolvedValue(mockUser);

      // Mock the database query that fetches user with addresses
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        addresses: mockAddresses // Add this to match what the API returns
      });

      const request = new NextRequest('http://localhost/api/user/profile');
      const response = await profileHandler(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('name', mockUser.name);
      expect(data).toHaveProperty('email', mockUser.email);
      expect(data).toHaveProperty('addresses'); // Check that addresses are included
    });

    it('should update profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '+9876543210',
        address: {
          country: 'Updated Country',
          province: 'Updated Province',
          city: 'Updated City',
          neighbourhood: 'Updated Neighbourhood',
          nearestLandmark: 'Updated Landmark',
          zipcode: '54321',
          isDefault: true
        }
      };

      (authHandler as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, ...updateData });

      const request = new NextRequest('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      const response = await updateProfileHandler(request);
      expect(response.status).toBe(200);
    });

    it('should update password successfully', async () => {
      const hashedPassword = await hashPassword('OldPass123');
      (authHandler as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: hashedPassword
      });

      const request = new NextRequest('http://localhost/api/user/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: 'OldPass123',
          password: 'NewPass123',
          passwordConfirmation: 'NewPass123'
        }),
      });

      const response = await updatePasswordHandler(request);
      expect(response.status).toBe(200);
    });

    it('should handle unauthorized access for profile get', async () => {
      const unauthorizedResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      (authHandler as jest.Mock).mockResolvedValue(unauthorizedResponse);

      const request = new NextRequest('http://localhost/api/user/profile');
      const response = await profileHandler(request);
      expect(response.status).toBe(401);
    });

    it('should handle unauthorized access for profile update', async () => {
      const unauthorizedResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      (authHandler as jest.Mock).mockResolvedValue(unauthorizedResponse);

      const request = new NextRequest('http://localhost/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '+9876543210'
        }),
      });

      const response = await updateProfileHandler(request);
      expect(response.status).toBe(401);
    });

    it('should handle unauthorized access for password update', async () => {
      const unauthorizedResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      (authHandler as jest.Mock).mockResolvedValue(unauthorizedResponse);

      const request = new NextRequest('http://localhost/api/user/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: 'OldPass123',
          password: 'NewPass123',
          passwordConfirmation: 'NewPass123'
        }),
      });

      const response = await updatePasswordHandler(request);
      expect(response.status).toBe(401);
    });
  });
}); 