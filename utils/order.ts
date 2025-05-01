// Types for the originalValues object structure
export interface ValueWithNote<T> {
    value: T;
    note?: string;
}

export interface OriginalOrderItemValues {
    price?: ValueWithNote<number>;
    quantity?: ValueWithNote<number>;
    [key: string]: ValueWithNote<any> | undefined;
}

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue }
interface JsonArray extends Array<JsonValue> { }

/**
 * Parse the originalValues field from an order item safely
 * @param originalValues The originalValues from the order item
 * @returns A properly typed object with the original values
 */
export function parseOriginalValues(originalValues: any): OriginalOrderItemValues {
    if (!originalValues) {
        return {};
    }

    try {
        // If it's a string, parse it as JSON
        const parsed = typeof originalValues === 'string'
            ? JSON.parse(originalValues)
            : originalValues;

        return parsed as OriginalOrderItemValues;
    } catch (error) {
        console.error('Failed to parse original values:', error);
        return {};
    }
}

/**
 * Get the original value for a specific field with proper type safety
 * @param originalValues The originalValues from the order item
 * @param field The field to extract (e.g., 'price', 'quantity')
 * @param fallbackValue Optional fallback value if original value doesn't exist
 * @returns The original value or fallback value
 */
export function getOriginalValue<T>(
    originalValues: any,
    field: string,
    fallbackValue?: T
): T | undefined {
    const parsed = parseOriginalValues(originalValues);
    const fieldData = parsed[field] as ValueWithNote<T> | undefined;

    return fieldData?.value ?? fallbackValue;
}

/**
 * Get the note for a specific field with proper type safety
 * @param originalValues The originalValues from the order item
 * @param field The field to extract the note from (e.g., 'price', 'quantity')
 * @returns The note string or undefined if no note exists
 */
export function getOriginalNote(
    originalValues: any,
    field: string
): string | undefined {
    const parsed = parseOriginalValues(originalValues);
    const fieldData = parsed[field];

    return fieldData?.note;
}

/**
 * Get valid status transitions based on current status and user role
 * @param currentStatus The current order status
 * @param userRole The role of the user (ADMIN or CUSTOMER)
 * @returns Array of valid status values the order can transition to
 */
export function getValidStatusTransitions(
    currentStatus: string,
    userRole: 'ADMIN' | 'CUSTOMER'
): string[] {
    if (userRole === 'ADMIN') {
        switch (currentStatus) {
            case 'PENDING':
                return ['REJECTED', 'ACCEPTED', 'CUSTOMER_PENDING'];
            case 'ADMIN_PENDING':
                return ['REJECTED', 'CUSTOMER_PENDING', 'ACCEPTED'];
            case 'CUSTOMER_PENDING':
                return ['REJECTED'];
            case 'ACCEPTED':
                return ['CANCELLED', 'COMPLETED'];
            default:
                return [];
        }
    } else { // CUSTOMER
        switch (currentStatus) {
            case 'CUSTOMER_PENDING':
                return ['REJECTED', 'PENDING'];
            default:
                return [];
        }
    }
}

/**
 * Check if a status transition is valid
 * @param currentStatus The current order status
 * @param newStatus The proposed new status
 * @param userRole The role of the user (ADMIN or CUSTOMER)
 * @returns Boolean indicating if the transition is allowed
 */
export function isValidStatusTransition(
    currentStatus: string,
    newStatus: string,
    userRole: 'ADMIN' | 'CUSTOMER'
): boolean {
    const validTransitions = getValidStatusTransitions(currentStatus, userRole);
    return validTransitions.includes(newStatus);
}

/**
 * Calculates the total price of an order
 * @param order An order object with items array
 * @returns The total price of the order
 */
export function calculateOrderTotal(order: { items: any[] }): number {
    return order.items.reduce(
        (total, item) => total + (Number(item.price) * item.quantity),
        0
    );
}

/**
 * Calculates the discount amount based on promo code details
 * @param order An order object with items array
 * @param promoCode Object containing discount information
 * @returns The calculated discount amount
 */
export function calculatePromoDiscount(
    order: { items: any[] },
    promoCode: {
        discountAmount?: string | number | null;
        discountPercent?: string | number | null;
    }
): number {
    // Calculate order subtotal
    const orderTotal = calculateOrderTotal(order);

    // Calculate discount amount based on promo code type
    let discountAmount = 0;
    if (promoCode.discountAmount) {
        discountAmount = Number(promoCode.discountAmount);
    } else if (promoCode.discountPercent) {
        discountAmount = (orderTotal * Number(promoCode.discountPercent)) / 100;
    }

    // Apply the discount, capped at the order total
    return Math.min(discountAmount, orderTotal);
}

/**
 * Validate complex order status transitions with additional context
 * @param order Current order object
 * @param newStatus Requested new status
 * @param userRole Role of the user making the request
 * @param hasItemChanges Whether there are item changes in the current request
 * @returns Object indicating if transition is valid and any error message
 */
export function validateOrderStatusUpdate(
    order: { status: string; itemsEdited?: boolean | null | undefined },
    newStatus: string,
    userRole: 'ADMIN' | 'CUSTOMER',
    hasItemChanges: boolean
): { valid: boolean; message?: string } {
    const currentStatus = order.status;
    const hasEditedItems = order?.itemsEdited === true;

    // First check basic status transition validity
    if (!isValidStatusTransition(currentStatus, newStatus, userRole)) {
        return {
            valid: false,
            message: `Cannot transition from ${currentStatus} to ${newStatus} as ${userRole}`
        };
    }

    // Special case: If order has edited items and admin is trying to accept it directly
    if (currentStatus === 'PENDING' && newStatus === 'ACCEPTED' && hasEditedItems) {
        return {
            valid: false,
            message: "This order has modified items. Send quote to customer for approval first."
        };
    }

    // If PENDING status with item changes in this request, can't accept directly
    if (currentStatus === 'PENDING' && newStatus === 'ACCEPTED' && hasItemChanges) {
        return {
            valid: false,
            message: "Cannot accept an order with modifications. Send quote to customer instead."
        };
    }

    // Special case: Allow accepting ADMIN_PENDING directly if no changes in request
    if (currentStatus === 'ADMIN_PENDING' && newStatus === 'ACCEPTED' && hasItemChanges) {
        return {
            valid: false,
            message: "Cannot accept an order with modifications. Send quote to customer instead."
        };
    }

    // If we got here, the transition is valid
    return { valid: true };
}

/**
 * Builds the data object for updating an order item
 * @param itemUpdate The update data from the request
 * @param existingItem The existing order item from the database
 * @param originalValues The parsed original values or empty object
 * @returns The prepared update data object for Prisma
 */
export function buildItemUpdateData(
    itemUpdate: {
        price?: number;
        priceNote?: string;
        quantity?: number;
        quantityNote?: string;
    },
    existingItem: {
        id: string;
        price: number | string;
        quantity: number;
        priceEdited?: boolean;
        quantityEdited?: boolean;
    },
    originalValues: OriginalOrderItemValues = {}
): {
    price?: number;
    priceEdited?: boolean;
    quantity?: number;
    quantityEdited?: boolean;
    originalValues: string;
} {
    // Deep clone the original values to avoid mutation
    const updatedValues = JSON.parse(JSON.stringify(originalValues));
    const updateData: any = {};

    // Handle price update
    if (itemUpdate.price !== undefined) {
        // If this is the first edit or we're adding a note to an existing edit
        if (!existingItem.priceEdited || itemUpdate.priceNote) {
            if (!updatedValues.price) {
                updatedValues.price = {
                    value: Number(existingItem.price),
                    note: ""
                };
            }

            if (itemUpdate.priceNote) {
                updatedValues.price.note = itemUpdate.priceNote;
            }
        }

        updateData.price = itemUpdate.price;
        updateData.priceEdited = true;
    }

    // Handle quantity update
    if (itemUpdate.quantity !== undefined) {
        // If this is the first edit or we're adding a note to an existing edit
        if (!existingItem.quantityEdited || itemUpdate.quantityNote) {
            if (!updatedValues.quantity) {
                updatedValues.quantity = {
                    value: existingItem.quantity,
                    note: ""
                };
            }

            if (itemUpdate.quantityNote) {
                updatedValues.quantity.note = itemUpdate.quantityNote;
            }
        }

        updateData.quantity = itemUpdate.quantity;
        updateData.quantityEdited = true;
    }

    // Serialize the updated original values
    updateData.originalValues = JSON.stringify(updatedValues);

    return updateData;
}

/**
 * Mark an order as edited in the database
 * @param prisma PrismaClient instance 
 * @param orderId ID of the order to mark as edited
 * @returns The result of the update operation
 */
export async function markOrderAsEdited(prisma: any, orderId: string): Promise<any> {
    try {
        return await prisma.order.update({
            where: { id: orderId },
            data: { itemsEdited: true }
        });
    } catch (error) {
        console.warn('Could not update itemsEdited flag:', error);
        // Return null to indicate failure but not critical
        return null;
    }
}

/**
 * Update an order item with appropriate tracking of original values
 * @param prisma PrismaClient instance
 * @param orderId ID of the order containing the item
 * @param itemUpdate Update data for the item
 * @param existingItems Array of existing items in the order
 * @returns The updated order item or null if not found
 */
export async function updateOrderItem(
    prisma: any,
    orderId: string,
    itemUpdate: {
        id: string;
        price?: number;
        priceNote?: string;
        quantity?: number;
        quantityNote?: string;
    },
    existingItems: Array<{
        id: string;
        price: number | string;
        quantity: number;
        priceEdited?: boolean;
        quantityEdited?: boolean;
        originalValues?: any;
    }>
): Promise<any> {
    // Find the existing item
    const existingItem = existingItems.find(item => item.id === itemUpdate.id);
    if (!existingItem) {
        console.warn(`Order item ${itemUpdate.id} not found in order ${orderId}`);
        return null;
    }

    // Parse original values
    const originalValues = parseOriginalValues(existingItem.originalValues);

    // Build update data
    const updateData = buildItemUpdateData(itemUpdate, existingItem, originalValues);

    // Update the item in the database
    const updatedItem = await prisma.orderItem.update({
        where: { id: itemUpdate.id },
        data: updateData
    });

    // Mark the order as edited
    await markOrderAsEdited(prisma, orderId);

    return updatedItem;
}

/**
 * Add a new item to an order with appropriate tracking of changes
 * @param prisma PrismaClient instance
 * @param orderId ID of the order to add the item to
 * @param newItem New item data
 * @param product Product data for the new item
 * @returns The created order item
 */
export async function addNewOrderItem(
    prisma: any,
    orderId: string,
    newItem: {
        productId: string;
        quantity: number;
        price: number;
        priceNote?: string;
        quantityNote?: string;
    },
    product: {
        id: string;
        price: number | string;
        name: string;
    }
): Promise<any> {
    // Check if price is different from product price
    const isPriceEdited = newItem.price !== Number(product.price);

    // Create originalValues object if needed
    const originalValues = isPriceEdited ? {
        price: {
            value: Number(product.price),
            note: newItem.priceNote || `Item added by admin with custom price`
        }
    } : undefined;

    // Create the new item
    const createdItem = await prisma.orderItem.create({
        data: {
            orderId: orderId,
            productId: newItem.productId,
            quantity: newItem.quantity,
            price: newItem.price,
            priceEdited: isPriceEdited,
            quantityEdited: false,
            adminAdded: true,
            originalValues: originalValues ? JSON.stringify(originalValues) : undefined
        }
    });

    // Mark the order as edited
    await markOrderAsEdited(prisma, orderId);

    return createdItem;
}

/**
 * Remove an item from an order
 * @param prisma PrismaClient instance
 * @param orderId ID of the order
 * @param itemId ID of the item to remove
 * @returns The result of the delete operation or null if item not found
 */
export async function removeOrderItem(
    prisma: any,
    orderId: string,
    itemId: string,
    existingItems: Array<{ id: string }>
): Promise<any> {
    // Check if the item exists in the order
    const itemExists = existingItems.some(item => item.id === itemId);
    if (!itemExists) {
        console.warn(`Order item ${itemId} not found in order ${orderId} for removal`);
        return null;
    }

    // Delete the item
    const result = await prisma.orderItem.delete({
        where: { id: itemId }
    });

    // Mark the order as edited
    await markOrderAsEdited(prisma, orderId);

    return result;
}

/**
 * Calculate final order total including all discounts
 * @param order Order object with items, promoDiscount and adminDiscount
 * @returns The final total amount
 */
export function calculateFinalOrderTotal(order: {
    items: any[];
    promoDiscount?: number | null;
    adminDiscount?: number | null;
}): number {
    // Calculate subtotal
    const subtotal = calculateOrderTotal(order);

    // Apply discounts
    const promoDiscount = order.promoDiscount ? Number(order.promoDiscount) : 0;
    const adminDiscount = order.adminDiscount ? Number(order.adminDiscount) : 0;

    // Calculate final total (ensure it doesn't go below zero)
    return Math.max(0, subtotal - promoDiscount - adminDiscount);
} 