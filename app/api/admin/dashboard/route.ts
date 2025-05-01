import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"
import { authHandler } from '@/lib/auth-handler'

export async function GET(request: NextRequest) {
  try {
    const userOrResponse = await authHandler(request)
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const user = userOrResponse
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized", details: "User is not an admin" },
        { status: 401 }
      )
    }

    const [
      totalProducts,
      totalOrders,
      pendingOrders,
      totalCustomers,
      recentOrders
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({
        where: { status: OrderStatus.PENDING }
      }),
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })
    ])

    return NextResponse.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      totalCustomers,
      recentOrders
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 