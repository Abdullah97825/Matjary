import { NextRequest, NextResponse } from 'next/server'
import { authHandler } from "@/lib/auth-handler"
import { prisma } from '@/lib/prisma'

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