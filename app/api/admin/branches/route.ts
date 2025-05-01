import { NextRequest, NextResponse } from "next/server";
import { authHandler } from "@/lib/auth-handler";
import { prisma } from "@/lib/prisma";
import { branchSchema } from "@/schemas/contact";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const userOrResponse = await authHandler(req);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = branchSchema.parse(await req.json());

    // If this is marked as main branch, remove main status from others
    if (data.isMain) {
      await prisma.branch.updateMany({
        where: { isMain: true },
        data: { isMain: false }
      });
    }

    const branch = await prisma.branch.create({
      data: {
        name: data.name,
        isMain: data.isMain,
        address: data.address,
        mapEnabled: data.mapEnabled,
        latitude: data.latitude,
        longitude: data.longitude,
        mapZoomLevel: data.mapZoomLevel,
        contacts: {
          create: data.contacts
        },
        businessHours: {
          create: data.businessHours
        },
        sections: {
          create: data.sections
        }
      },
      include: {
        contacts: true,
        businessHours: true,
        sections: true
      }
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error('[BRANCH_CREATE]', error);
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userOrResponse = await authHandler(req);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * perPage;

    const where: Prisma.BranchWhereInput = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { address: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
      ]
    } : {};

    const [total, branches] = await prisma.$transaction([
      prisma.branch.count({ where }),
      prisma.branch.findMany({
        where,
        include: {
          contacts: true,
          businessHours: { orderBy: { dayOfWeek: 'asc' } },
          sections: { orderBy: { order: 'asc' } }
        },
        orderBy: { isMain: 'desc' },
        skip,
        take: perPage
      })
    ]);

    return NextResponse.json({
      data: branches,
      meta: {
        current_page: page,
        last_page: Math.ceil(total / perPage),
        per_page: perPage,
        total
      }
    });
  } catch (error) {
    console.error('[BRANCHES_GET]', error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
} 