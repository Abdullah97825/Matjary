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

        // Check for pending orders with this product
        const pendingOrders = await prisma.orderItem.findMany({
            where: {
                productId: id,
                order: {
                    status: {
                        in: ['PENDING', 'ADMIN_PENDING', 'CUSTOMER_PENDING']
                    }
                }
            },
            select: {
                order: {
                    select: {
                        id: true
                    }
                }
            }
        });

        // Update the product to set isArchived to true
        await prisma.product.update({
            where: { id },
            data: {
                isArchived: true
            }
        });

        // Remove product from all carts
        await prisma.cartItem.deleteMany({
            where: { productId: id }
        });

        // Return success with a warning if there are pending orders
        if (pendingOrders.length > 0) {
            const orderIds = [...new Set(pendingOrders.map(item => item.order.id))];
            return NextResponse.json({
                success: true,
                warning: `Product was archived. Product is in ${orderIds.length} pending orders. These orders cannot be accepted until the product is unarchived.`,
                affectedOrders: orderIds
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[PRODUCT_ARCHIVE]', error);
        return NextResponse.json(
            { error: "Failed to archive product", message: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 