import { NextRequest, NextResponse } from "next/server"
import { authHandler } from "@/lib/auth-handler"
import { prisma } from "@/lib/prisma"

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
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Update the product to set isArchived to false
        const product = await prisma.product.update({
            where: { id },
            data: {
                isArchived: false
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[PRODUCT_UNARCHIVE]', error);
        return NextResponse.json(
            { error: "Failed to unarchive product", message: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 