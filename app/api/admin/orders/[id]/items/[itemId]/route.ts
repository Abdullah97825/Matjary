import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from "@/lib/auth-handler";
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface OrderItemUpdateData {
    price?: number;
    priceEdited?: boolean;
    quantity?: number;
    quantityEdited?: boolean;
    originalValues?: string;
}
interface OrderItemParams {
    params: Promise<{
        id: string;
        itemId: string;
    }>
}

// Validation schema for updating order item
const updateOrderItemSchema = z.object({
    quantity: z.number().min(1).optional(),
    quantityNote: z.string().optional(),
    price: z.number().min(0).optional(),
    priceNote: z.string().optional(),
});

export async function PATCH(
    request: NextRequest,
    { params }: OrderItemParams
) {
    try {
        const userOrResponse = await authHandler(request);
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

        const { id: orderId, itemId } = await params;

        // Get the existing order item to check if it exists
        const orderItem = await prisma.orderItem.findFirst({
            where: {
                id: itemId,
                orderId
            },
            include: {
                product: true
            }
        });

        if (!orderItem) {
            return NextResponse.json(
                { error: "Order item not found" },
                { status: 404 }
            );
        }

        // Parse the request body
        const body = await request.json();
        let validatedData;

        try {
            validatedData = updateOrderItemSchema.parse(body);
        } catch (error) {
            return NextResponse.json(
                { error: "Invalid request data", details: error },
                { status: 400 }
            );
        }

        // Store original values if this is the first edit
        const originalValues = orderItem.originalValues ? JSON.parse(orderItem.originalValues as string) : {};

        // If this is the first edit of price or quantity, store the original value with optional note
        if (validatedData.price !== undefined && !orderItem.priceEdited) {
            originalValues.price = {
                value: Number(orderItem.price),
                note: validatedData.priceNote || ""
            };
        } else if (validatedData.price !== undefined && validatedData.priceNote) {
            // Update just the note if price was already edited
            if (originalValues.price) {
                originalValues.price.note = validatedData.priceNote;
            } else {
                originalValues.price = {
                    value: Number(orderItem.price),
                    note: validatedData.priceNote
                };
            }
        }

        if (validatedData.quantity !== undefined && !orderItem.quantityEdited) {
            originalValues.quantity = {
                value: orderItem.quantity,
                note: validatedData.quantityNote || ""
            };
        } else if (validatedData.quantity !== undefined && validatedData.quantityNote) {
            // Update just the note if quantity was already edited
            if (originalValues.quantity) {
                originalValues.quantity.note = validatedData.quantityNote;
            } else {
                originalValues.quantity = {
                    value: orderItem.quantity,
                    note: validatedData.quantityNote
                };
            }
        }

        // Prepare the update data
        const updateData: OrderItemUpdateData = {
            originalValues: JSON.stringify(originalValues)
        };

        if (validatedData.price !== undefined) {
            updateData.price = validatedData.price;
            updateData.priceEdited = true;
        }

        if (validatedData.quantity !== undefined) {
            updateData.quantity = validatedData.quantity;
            updateData.quantityEdited = true;
        }

        // Update the order item
        const updatedOrderItem = await prisma.orderItem.update({
            where: { id: itemId },
            data: updateData,
            include: {
                product: true
            }
        });


        return NextResponse.json({
            id: updatedOrderItem.id,
            quantity: updatedOrderItem.quantity,
            price: Number(updatedOrderItem.price),
            priceEdited: updatedOrderItem.priceEdited,
            quantityEdited: updatedOrderItem.quantityEdited,
            originalValues: originalValues,
            product: {
                id: updatedOrderItem.product.id,
                name: updatedOrderItem.product.name
            }
        });
    } catch (error) {
        console.error('[ORDER_ITEM_UPDATE]', error);
        return NextResponse.json(
            { error: "Failed to update order item" },
            { status: 500 }
        );
    }
} 