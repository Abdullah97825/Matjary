import { NextRequest, NextResponse } from 'next/server'
import { authHandler } from "@/lib/auth-handler"
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const userOrResponse = await authHandler(req);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const customer = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true
          }
        },
        addresses: true
      }
    })

    if (!customer) {
      return new NextResponse('Customer not found', { status: 404 })
    }

    // Transform to match CustomerDetails interface
    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      isActive: customer.isActive,
      ordersCount: customer.orders.length,
      totalSpent: customer.orders.reduce((total, order) => {
        return total + order.items.reduce((orderTotal, item) => {
          return orderTotal + Number(item.price) * item.quantity
        }, 0)
      }, 0),
      addresses: customer.addresses.map(address => ({
        id: address.id,
        country: address.country,
        province: address.province,
        city: address.city,
        neighbourhood: address.neighbourhood,
        nearestLandmark: address.nearestLandmark,
        zipcode: address.zipcode,
        isDefault: address.isDefault
      })),
      orders: customer.orders.map(order => ({
        id: order.id,
        status: order.status,
        createdAt: order.createdAt,
        total: order.items.reduce((sum, item) =>
          sum + Number(item.price) * item.quantity, 0
        )
      }))
    })
  } catch (error) {
    console.error('[CUSTOMER_GET]', error)
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const userOrResponse = await authHandler(req);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params;
    const body = await req.json();

    // Validate the request body
    const schema = z.object({
      isActive: z.boolean()
    });

    const { isActive } = schema.parse(body);

    // Update the user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        isActive: true
      }
    });

    return NextResponse.json({
      id: updatedUser.id,
      isActive: updatedUser.isActive,
      message: updatedUser.isActive ? "User account activated" : "User account deactivated"
    });
  } catch (error) {
    console.error('[CUSTOMER_PATCH]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update customer status" },
      { status: 500 }
    );
  }
} 