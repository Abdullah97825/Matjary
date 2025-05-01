import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from "@/lib/auth-handler";
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

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
    const search = searchParams.get('search');
    const status = searchParams.get('status') as OrderStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '10');
    const skip = (page - 1) * per_page;

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { id: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } }
        ]
      })
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: per_page
      }),
      prisma.order.count({ where })
    ]);

    return NextResponse.json({
      data: orders,
      meta: {
        total,
        last_page: Math.ceil(total / per_page)
      }
    });
  } catch (error) {
    console.error('[ORDERS_GET]', error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
} 