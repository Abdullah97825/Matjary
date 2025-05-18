import { NextRequest, NextResponse } from "next/server";
import { authHandler } from "@/lib/auth-handler";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
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
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const per_page = Number(searchParams.get('per_page')) || 10;
    const search = searchParams.get('search');
    const activeParam = searchParams.get('active');
    const activeFilter = activeParam !== null ? activeParam === 'true' : null;
    const skip = (page - 1) * per_page;

    const where: Prisma.UserWhereInput = {
      role: Role.CUSTOMER,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          { phone: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
        ]
      }),
      ...(activeFilter !== null && {
        isActive: activeFilter
      })
    };

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          isActive: true,
          _count: {
            select: { orders: true }
          },
          orders: {
            select: {
              items: {
                select: {
                  price: true,
                  quantity: true
                }
              }
            }
          }
        },
        skip,
        take: per_page,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      isActive: customer.isActive,
      ordersCount: customer._count.orders,
      totalSpent: customer.orders.reduce((total, order) =>
        total + order.items.reduce((orderTotal, item) =>
          orderTotal + (Number(item.price.toString()) * item.quantity), 0
        ), 0
      )
    }));

    return NextResponse.json({
      data: formattedCustomers,
      meta: {
        current_page: page,
        per_page,
        total,
        last_page: Math.ceil(total / per_page)
      }
    });
  } catch (error) {
    console.error('[CUSTOMERS_GET]', error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
} 