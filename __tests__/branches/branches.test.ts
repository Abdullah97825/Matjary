import { NextRequest, NextResponse } from 'next/server';
import { POST as createBranchHandler } from '@/app/api/admin/branches/route';
import { PATCH as updateBranchHandler, DELETE as deleteBranchHandler } from '@/app/api/admin/branches/[id]/route';
import { prisma } from '@/lib/prisma';
import { authHandler } from '@/lib/auth-handler';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    branch: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    contactDetail: {
      deleteMany: jest.fn(),
    },
    businessHours: {
      deleteMany: jest.fn(),
    },
    branchSection: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock auth utilities
jest.mock('@/lib/auth-handler', () => ({
  authHandler: jest.fn(),
}));

describe('Branch Management API', () => {
  const mockAdmin = {
    id: '1',
    role: 'ADMIN',
    email: 'admin@example.com'
  };

  const mockBranchData = {
    name: 'Test Branch',
    isMain: true,
    address: '123 Test St',
    mapEnabled: true,
    latitude: 37.7749,
    longitude: -122.4194,
    mapZoomLevel: 14,
    contacts: [
      {
        type: 'PHONE',
        value: '+1234567890',
        label: 'Main',
        isMain: true,
        order: 0
      }
    ],
    businessHours: Array(7).fill(null).map((_, i) => ({
      dayOfWeek: i,
      openTime: '09:00',
      closeTime: '17:00',
      isClosed: i === 0
    })),
    sections: [
      {
        title: 'About',
        content: 'Test content',
        order: 0,
        isEnabled: true
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Branch', () => {
    it('should create a branch when admin authenticated', async () => {
      (authHandler as jest.Mock).mockResolvedValue(mockAdmin);
      (prisma.branch.create as jest.Mock).mockResolvedValue({ id: '1', ...mockBranchData });

      const request = new NextRequest('http://localhost/api/admin/branches', {
        method: 'POST',
        body: JSON.stringify(mockBranchData),
      });

      const response = await createBranchHandler(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe(mockBranchData.name);
    });

    it('should handle unauthorized access', async () => {
      const unauthorizedResponse = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      (authHandler as jest.Mock).mockResolvedValue(unauthorizedResponse);

      const request = new NextRequest('http://localhost/api/admin/branches', {
        method: 'POST',
        body: JSON.stringify(mockBranchData),
      });

      const response = await createBranchHandler(request);
      expect(response.status).toBe(401);
    });

    it('should handle non-admin access', async () => {
      const nonAdmin = {
        id: '2',
        role: 'CUSTOMER',
        email: 'customer@example.com'
      };
      (authHandler as jest.Mock).mockResolvedValue(nonAdmin);

      const request = new NextRequest('http://localhost/api/admin/branches', {
        method: 'POST',
        body: JSON.stringify(mockBranchData),
      });

      const response = await createBranchHandler(request);
      expect(response.status).toBe(401);
    });
  });

  describe('Update Branch', () => {
    it('should update a branch when admin authenticated', async () => {
      (authHandler as jest.Mock).mockResolvedValue(mockAdmin);
      (prisma.$transaction as jest.Mock).mockResolvedValue([]);
      (prisma.branch.update as jest.Mock).mockResolvedValue({ id: '1', ...mockBranchData });

      const request = new NextRequest('http://localhost/api/admin/branches/1', {
        method: 'PATCH',
        body: JSON.stringify(mockBranchData),
      });

      const response = await updateBranchHandler(request, { params: Promise.resolve({ id: '1' }) });
      expect(response.status).toBe(200);
    });
  });

  describe('Delete Branch', () => {
    it('should delete a branch when admin authenticated', async () => {
      (authHandler as jest.Mock).mockResolvedValue(mockAdmin);
      (prisma.branch.delete as jest.Mock).mockResolvedValue({ id: '1' });

      const request = new NextRequest('http://localhost/api/admin/branches/1', {
        method: 'DELETE',
      });

      const response = await deleteBranchHandler(request, { params: Promise.resolve({ id: '1' }) });
      expect(response.status).toBe(200);
    });
  });
}); 