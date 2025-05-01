import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';
import { addressFormSchema } from '@/schemas/address';

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
    const body = await request.json();
    const validatedData = addressFormSchema.parse(body);

    // Verify address belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id }
    });

    if (!existingAddress || existingAddress.userId !== user.id) {
      return new NextResponse('Address not found', { status: 404 });
    }

    // If setting as default, remove default from other addresses
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error updating address:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
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
    const address = await prisma.address.findUnique({
      where: { id }
    });

    if (!address || address.userId !== user.id) {
      return new NextResponse('Address not found', { status: 404 });
    }

    await prisma.address.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting address:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}