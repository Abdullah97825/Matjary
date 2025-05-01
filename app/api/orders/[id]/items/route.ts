import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authenticate user
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = userOrResponse;
        const { id: orderId } = await params;

        // Get the order and verify it belongs to the current user
        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
                userId: user.id
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                hidePrice: true,
                                negotiablePrice: true
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify the order is in CUSTOMER_PENDING status
        if (order.status !== 'CUSTOMER_PENDING') {
            return NextResponse.json(
                { error: 'Cannot modify order items unless the order is in CUSTOMER_PENDING status' },
                { status: 400 }
            );
        }

        const { items = [], newItems = [], submitForReview = false, acceptChanges = false, note = '' } = await request.json();

        // Define a transaction to process all changes atomically
        const result = await prisma.$transaction(async (tx) => {
            // Track if there are any hidden price items
            let hasHiddenPriceItems = false;

            // Process existing item updates
            for (const item of items) {
                const orderItem = order.items.find(i => i.id === item.id);

                if (!orderItem) {
                    throw new Error(`Order item ${item.id} not found`);
                }

                // Check if this is an admin-added item and prevent modification
                if (orderItem.adminAdded) {
                    throw new Error(`Item ${orderItem.product.name} was added by admin and cannot be modified`);
                }

                if (item.removed) {
                    // Remove the item
                    await tx.orderItem.delete({
                        where: { id: item.id }
                    });
                } else if (item.quantity !== undefined && item.quantity !== orderItem.quantity) {
                    // Store the original quantity before updating
                    const existingValues = orderItem.originalValues || {};
                    const originalValuesObj = typeof existingValues === 'string'
                        ? JSON.parse(existingValues.toString())
                        : existingValues;

                    // Only update the quantity field in originalValues if not already set
                    // This preserves the very first value in case of multiple edits
                    if (!originalValuesObj.quantity) {
                        originalValuesObj.quantity = {
                            value: orderItem.quantity
                        };
                    }

                    // Update the quantity
                    await tx.orderItem.update({
                        where: { id: item.id },
                        data: {
                            quantity: item.quantity,
                            quantityEdited: true,
                            originalValues: originalValuesObj
                        }
                    });
                }
            }

            // Process new items
            for (const newItem of newItems) {
                // Verify the product exists - allow hidden price products
                const product = await tx.product.findUnique({
                    where: {
                        id: newItem.productId
                    }
                });

                if (!product) {
                    throw new Error(`Product ${newItem.productId} not found`);
                }

                // Check if this is a hidden price product
                if (product.hidePrice) {
                    hasHiddenPriceItems = true;
                }

                // Add the new item to the order
                await tx.orderItem.create({
                    data: {
                        orderId,
                        productId: newItem.productId,
                        quantity: newItem.quantity,
                        price: product.price,
                        priceEdited: false,
                        quantityEdited: false
                    }
                });
            }

            // Determine new status based on submissions and hidden price items
            let newStatus = order.status; // Default: keep current status

            // If there are hidden price items, always go to ADMIN_PENDING
            if (hasHiddenPriceItems) {
                newStatus = 'ADMIN_PENDING';
            }
            // Otherwise, if customer wants to accept changes, go to PENDING
            else if (acceptChanges || submitForReview) {
                newStatus = 'PENDING';
            }

            // Update the order (don't set itemsEdited for customer changes)
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: newStatus,
                    itemsEdited: false // Explicitly set to false to indicate customer approval of all changes
                }
            });

            // Create history entry with appropriate message
            let historyNote = 'Customer modified order items';
            if (hasHiddenPriceItems) {
                historyNote = 'Customer submitted order for admin price review';
            } else if (acceptChanges || submitForReview) {
                historyNote = 'Customer approved changes and submitted order';
            }

            // Add the customer's note if provided
            if (note) {
                historyNote += `: ${note}`;
            }

            await tx.orderStatusHistory.create({
                data: {
                    orderId: orderId,
                    previousStatus: order.status,
                    newStatus: newStatus,
                    note: historyNote,
                    createdById: user.id
                }
            });

            return {
                success: true,
                statusChanged: newStatus !== order.status,
                newStatus: newStatus,
                hasHiddenPriceItems: hasHiddenPriceItems
            };
        });

        // Generate appropriate success message
        let successMessage = 'Order items updated successfully';
        if (result.hasHiddenPriceItems) {
            successMessage = 'Order items updated successfully and sent for admin review';
        } else if (acceptChanges || submitForReview) {
            successMessage = 'Order approved and submitted successfully';
        }

        return NextResponse.json({
            success: true,
            message: successMessage,
            statusChanged: result.statusChanged,
            newStatus: result.newStatus,
            hasHiddenPriceItems: result.hasHiddenPriceItems
        });
    } catch (error) {
        console.error('Error updating customer order items:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update order items' },
            { status: 500 }
        );
    }
} 