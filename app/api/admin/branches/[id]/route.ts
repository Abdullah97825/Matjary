import { NextRequest, NextResponse } from "next/server";
import { authHandler } from "@/lib/auth-handler";
import { prisma } from "@/lib/prisma";
import { branchSchema } from "@/schemas/contact";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    // If this is marked as main branch, remove main status from others
    if (data.isMain) {
      await prisma.branch.updateMany({
        where: {
          id: { not: id },
          isMain: true
        },
        data: { isMain: false }
      });
    }

    // Delete existing relations
    await prisma.$transaction([
      prisma.contactDetail.deleteMany({ where: { branchId: id } }),
      prisma.businessHours.deleteMany({ where: { branchId: id } }),
      prisma.branchSection.deleteMany({ where: { branchId: id } })
    ]);

    // Update branch with new data
    const branch = await prisma.branch.update({
      where: { id },
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
    console.error('[BRANCH_UPDATE]', error);
    return NextResponse.json(
      { error: "Failed to update branch" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrResponse = await authHandler(req);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.branch.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[BRANCH_DELETE]', error);
    return NextResponse.json(
      { error: "Failed to delete branch" },
      { status: 500 }
    );
  }
} 