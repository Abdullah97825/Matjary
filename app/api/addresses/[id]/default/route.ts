import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrResponse = await authHandler(request);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;

    const { id } = await params;

    // Verify address belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id }
    });

    if (!existingAddress || existingAddress.userId !== user.id) {
      return new NextResponse('Address not found', { status: 404 });
    }

    // First, remove default from all user's addresses
    await prisma.address.updateMany({
      where: {
        userId: user.id,
        isDefault: true
      },
      data: { isDefault: false }
    });

    // Then set the new default address
    const address = await prisma.address.update({
      where: { id },
      data: { isDefault: true }
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error setting default address:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 