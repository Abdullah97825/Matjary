import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from "@/lib/auth-handler";
import { prisma } from '@/lib/prisma';
import { PaymentMethod } from '@prisma/client';
import { z } from 'zod';
import {
    validateOrderStatusUpdate,
    calculateOrderTotal,
    calculatePromoDiscount,
    updateOrderItem,
    addNewOrderItem,
    removeOrderItem,
} from '@/utils/order';
import { Prisma } from '@prisma/client';
import { validatePromoCode } from '@/lib/promo-validator';
import { formatCurrency } from '@/utils/format';

interface OrderUpdateParams {
    params: Promise<{ id: string }>
}

// Schema for order item updates
const orderItemUpdateSchema = z.object({
    id: z.string(),
    quantity: z.number().min(1).optional(),
    quantityNote: z.string().optional(),
    price: z.number().min(0).optional(),
    priceNote: z.string().optional(),
});

// Schema for new order items
const newOrderItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    priceNote: z.string().optional(),
    quantityNote: z.string().optional(),
});

// Define the validation schema for order updates
const orderUpdateSchema = z.object({
    status: z.enum([
        'PENDING',
        'ADMIN_PENDING',
        'CUSTOMER_PENDING',
        'ACCEPTED',
        'REJECTED',
        'COMPLETED',
        'CANCELLED'
    ]).optional(),
    items: z.array(orderItemUpdateSchema).optional(),
    newItems: z.array(newOrderItemSchema).optional(),
    removedItemIds: z.array(z.string()).optional(),
    statusNote: z.string().optional(),
    adminDiscount: z.number().min(0).optional().nullable(),
    adminDiscountReason: z.string().optional().nullable()
});

export async function PATCH(
    request: NextRequest,
    { params }: OrderUpdateParams
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

        const { id: orderId } = await params;

        // Fetch the existing order to validate it exists
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Parse the request body
        const body = await request.json();
        let validatedData;

        try {
            validatedData = orderUpdateSchema.parse(body);
        } catch (error) {
            return NextResponse.json(
                { error: "Invalid request data", details: error },
                { status: 400 }
            );
        }

        // Prevent item updates if order is not in PENDING or ADMIN_PENDING status
        if (validatedData.items && validatedData.items.length > 0) {
            if (order.status !== 'PENDING' && order.status !== 'ADMIN_PENDING') {
                return NextResponse.json(
                    {
                        error: "Cannot edit order items",
                        message: "Order items can only be edited when the order is in PENDING or ADMIN_PENDING status"
                    },
                    { status: 400 }
                );
            }
        }

        // Prepare the order update data
        const orderUpdateData: Prisma.OrderUpdateInput = {};

        if (validatedData.status) {
            orderUpdateData.status = validatedData.status;
        }

        // Add admin discount if provided
        if (validatedData.adminDiscount !== undefined) {
            orderUpdateData.adminDiscount = validatedData.adminDiscount;
        }

        if (validatedData.adminDiscountReason !== undefined) {
            orderUpdateData.adminDiscountReason = validatedData.adminDiscountReason;
        }

        // Process the order status update if provided
        if (validatedData.status) {
            const currentStatus = order.status;
            const newStatus = validatedData.status;

            // Check if there are item updates being made in this request
            const hasItemUpdates = validatedData.items && validatedData.items.length > 0;
            const hasNewItems = validatedData.newItems && validatedData.newItems.length > 0;
            const hasRemovedItems = validatedData.removedItemIds && validatedData.removedItemIds.length > 0;
            const hasItemChangesInRequest = Boolean(hasItemUpdates || hasNewItems || hasRemovedItems);

            // Use the validation utility function to check status transitions
            const validationResult = validateOrderStatusUpdate(
                {
                    status: order.status,
                    itemsEdited: order.itemsEdited
                },
                newStatus,
                user.role,
                hasItemChangesInRequest
            );

            if (!validationResult.valid) {
                return NextResponse.json(
                    {
                        error: "Invalid status transition",
                        message: validationResult.message
                    },
                    { status: 400 }
                );
            }

            // Only create history entry if status is actually changing
            if (currentStatus !== newStatus) {
                // Special handling for ACCEPTED status to update product stock
                if (newStatus === 'ACCEPTED') {
                    try {
                        // Use a transaction to ensure all operations succeed or fail together
                        await prisma.$transaction(async (tx) => {
                            // Check for archived products in the order before proceeding
                            const orderProductIds = order.items.map(item => item.product.id);
                            const currentProducts = await tx.product.findMany({
                                where: { id: { in: orderProductIds } },
                                select: { id: true, name: true, isArchived: true }
                            });

                            const archivedProducts = currentProducts.filter(p => p.isArchived);
                            if (archivedProducts.length > 0) {
                                throw new Error(
                                    `Cannot accept order with archived products: ${archivedProducts.map(p => p.name).join(', ')}`
                                );
                            }

                            // Handle promo code validation and usage tracking if the order has a promo code
                            if (order.promoCodeId) {
                                // Fetch the current promo code with latest data
                                const promoCode = await tx.promoCode.findUnique({
                                    where: { id: order.promoCodeId },
                                    select: {
                                        id: true,
                                        code: true,
                                        discountAmount: true,
                                        discountPercent: true
                                    }
                                });

                                if (!promoCode) {
                                    throw new Error("The promo code associated with this order no longer exists");
                                }

                                // Calculate order total for validation
                                const orderTotal = calculateOrderTotal(order);

                                // Validate using the utility function
                                const validationResult = await validatePromoCode(
                                    promoCode.code,
                                    order.userId,
                                    orderTotal,
                                    tx // Pass the transaction
                                );

                                if (!validationResult.isValid) {
                                    throw new Error(validationResult.message);
                                }

                                // If all checks pass, update the promo code usage
                                await tx.promoCode.update({
                                    where: { id: promoCode.id },
                                    data: {
                                        usedCount: {
                                            increment: 1
                                        }
                                    }
                                });

                                // Check if the promo code is assigned to the user, and mark it as used if it is
                                const userAssignment = await tx.userPromoCode.findFirst({
                                    where: {
                                        userId: order.userId,
                                        promoCodeId: promoCode.id
                                    }
                                });

                                if (userAssignment) {
                                    await tx.userPromoCode.update({
                                        where: { id: userAssignment.id },
                                        data: {
                                            usedAt: new Date()
                                        }
                                    });
                                }

                                // Calculate the actual discount amount if not already set
                                if (!order.promoDiscount) {
                                    // Calculate and apply the discount
                                    const finalDiscount = calculatePromoDiscount(order, {
                                        discountAmount: promoCode.discountAmount ? Number(promoCode.discountAmount) : null,
                                        discountPercent: promoCode.discountPercent ? Number(promoCode.discountPercent) : null
                                    });

                                    // Update the order with the discount amount within the transaction
                                    await tx.order.update({
                                        where: { id: orderId },
                                        data: {
                                            promoDiscount: finalDiscount
                                        }
                                    });

                                    // Add this discount to the order update data for later use
                                    orderUpdateData.promoDiscount = finalDiscount;
                                }

                                // Format the discount amount for display
                                const discountDisplay = orderUpdateData.promoDiscount
                                    ? formatCurrency(Number(orderUpdateData.promoDiscount))
                                    : order.promoDiscount
                                        ? formatCurrency(Number(order.promoDiscount))
                                        : "applied";

                                // Add a note to the status history about the promo code
                                const promoNote = validatedData.statusNote ?
                                    `${validatedData.statusNote}\n\nPromo code "${promoCode.code}" applied with discount of ${discountDisplay}.` :
                                    `Promo code "${promoCode.code}" applied with discount of ${discountDisplay}.`;

                                validatedData.statusNote = promoNote;
                            }

                            // Update product stock for each order item
                            for (const item of order.items) {
                                // Fetch the current product to get the latest stock value
                                const product = await tx.product.findUnique({
                                    where: { id: item.product.id }
                                });

                                if (product) {
                                    // Only check and update stock if useStock is true
                                    if (product.useStock) {
                                        // Check if we have enough stock
                                        if (product.stock < item.quantity) {
                                            throw new Error(`Not enough stock for "${product.name}". Available: ${product.stock}, Required: ${item.quantity}`);
                                        }

                                        // Update the product stock
                                        await tx.product.update({
                                            where: { id: item.product.id },
                                            data: { stock: product.stock - item.quantity }
                                        });
                                    }
                                }
                            }
                        });
                    } catch (error) {
                        return NextResponse.json(
                            {
                                error: "Failed to process order",
                                message: error instanceof Error ? error.message : "Unknown error occurred during order processing"
                            },
                            { status: 400 }
                        );
                    }
                }
                // Special handling for CANCELLED status when coming from ACCEPTED to restore stock
                else if (newStatus === 'CANCELLED' && currentStatus === 'ACCEPTED') {
                    // This will be handled in a different endpoint that prompts the admin
                    // The stock restoration will be done based on admin choice

                    // This transition is invalid for this endpoint
                    return NextResponse.json(
                        {
                            error: "Invalid status transition",
                            message: "Cannot cancel an accepted order"
                        },
                        { status: 400 }
                    );
                }

                // First update the order status (now use the orderUpdateData object)
                // Add payment method to the existing orderUpdateData object if needed
                if (currentStatus === 'ADMIN_PENDING' && newStatus === 'ACCEPTED') {
                    orderUpdateData.paymentMethod = 'CASH' as PaymentMethod;
                }

                // Then create a history record
                await prisma.orderStatusHistory.create({
                    data: {
                        orderId: orderId,
                        previousStatus: currentStatus,
                        newStatus: newStatus,
                        note: validatedData.statusNote,
                        createdById: user.id
                    }
                });
            }
        }

        // Process item updates if provided
        if (validatedData.items && validatedData.items.length > 0) {
            // Process each item update using our utility function
            for (const itemUpdate of validatedData.items) {
                await updateOrderItem(
                    prisma,
                    orderId,
                    itemUpdate,
                    order.items.map(item => ({
                        id: item.id,
                        price: Number(item.price),
                        quantity: item.quantity,
                        priceEdited: item.priceEdited,
                        quantityEdited: item.quantityEdited,
                        originalValues: item.originalValues
                    }))
                );
            }
        }

        // Process new items if provided
        if (validatedData.newItems && validatedData.newItems.length > 0) {
            // Validate all new products exist and are not archived
            const productIds = validatedData.newItems.map(item => item.productId);
            const products = await prisma.product.findMany({
                where: { id: { in: productIds } }
            });

            if (products.length !== productIds.length) {
                return NextResponse.json(
                    { error: "One or more products not found" },
                    { status: 400 }
                );
            }

            // Check for archived products
            const archivedProducts = products.filter(product => product.isArchived);
            if (archivedProducts.length > 0) {
                return NextResponse.json(
                    {
                        error: "Cannot add archived products to order",
                        archivedProducts: archivedProducts.map(p => p.name)
                    },
                    { status: 400 }
                );
            }

            try {
                for (const newItem of validatedData.newItems) {
                    // Verify the product exists
                    const product = await prisma.product.findUnique({
                        where: { id: newItem.productId }
                    });

                    if (!product) {
                        console.warn(`Product ${newItem.productId} not found, skipping`);
                        continue;
                    }

                    // Check if this product is already in the order
                    const existingItem = order.items.find(item =>
                        item.product.id === newItem.productId
                    );

                    if (existingItem) {
                        // Update existing item quantity instead of creating new
                        await updateOrderItem(
                            prisma,
                            orderId,
                            {
                                id: existingItem.id,
                                quantity: existingItem.quantity + newItem.quantity,
                                quantityNote: newItem.quantityNote || "Item quantity updated by admin"
                            },
                            order.items.map(item => ({
                                id: item.id,
                                price: Number(item.price),
                                quantity: item.quantity,
                                priceEdited: item.priceEdited,
                                quantityEdited: item.quantityEdited,
                                originalValues: item.originalValues
                            }))
                        );
                    } else {
                        // Create new order item using our utility function
                        await addNewOrderItem(
                            prisma,
                            orderId,
                            newItem,
                            {
                                id: product.id,
                                price: Number(product.price),
                                name: product.name
                            }
                        );
                    }
                }
            } catch (error) {
                return NextResponse.json(
                    { error: "Failed to add new items to order" },
                    { status: 400 }
                );
            }
        }

        // Process removed items if provided
        if (validatedData.removedItemIds && validatedData.removedItemIds.length > 0) {
            for (const itemId of validatedData.removedItemIds) {
                await removeOrderItem(
                    prisma,
                    orderId,
                    itemId,
                    order.items
                );
            }
        }

        // Update the order with all collected changes
        await prisma.order.update({
            where: { id: orderId },
            data: orderUpdateData
        });

        // Fetch the updated order and return it
        const updatedOrder = await prisma.order.findUnique({
            where: { id: orderId },
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
            }
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('[ORDER_UPDATE]', error);
        return NextResponse.json(
            { error: "Failed to update order" },
            { status: 500 }
        );
    }
} 