'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/format';
import { orderService } from '@/services/order';
import { CustomerAddProductDialog, Product } from '@/components/customer/AddProductDialog';
import { getOriginalValue, getOriginalNote } from '@/utils/order';
import { PaymentMethod } from '@/components/order/paymentMethod';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    priceEdited?: boolean;
    quantityEdited?: boolean;
    originalValues?: string;
    adminAdded?: boolean;
    product: {
        id: string;
        name: string;
        price: number;
        thumbnail?: {
            url: string;
        };
        hidePrice?: boolean;
        negotiablePrice?: boolean;
    };
}

// Define a new interface that extends OrderItem for newly added items
interface NewOrderItem extends OrderItem {
    isNewItem: boolean;
}

interface CustomerItemEditorProps {
    orderId: string;
    initialItems: OrderItem[];
    // onChangesStateUpdate: (hasChanges: boolean) => void;
}

export function CustomerItemEditor({ orderId, initialItems }: CustomerItemEditorProps) {
    const [updatedItems, setUpdatedItems] = useState<Record<string, { quantity: number; removed: boolean }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
    const [note, setNote] = useState('');
    const [newItems, setNewItems] = useState<Array<{
        productId: string;
        quantity: number;
        product?: {
            id: string;
            name: string;
            price: number;
            hidePrice?: boolean;
            negotiablePrice?: boolean;
            thumbnail?: { url: string };
        }
    }>>([]);

    const hasChanges = Object.keys(updatedItems).length > 0 || newItems.length > 0;

    // Use useEffect to call the callback prop when hasChanges updates
    // useEffect(() => {
    //     onChangesStateUpdate(hasChanges);
    // }, [hasChanges, onChangesStateUpdate]);

    // Filter out removed items for UI display
    const displayItems = initialItems.filter(item => !updatedItems[item.id]?.removed);

    // Separate admin-added items from regular items
    const adminAddedItems = displayItems.filter(item => item.adminAdded);
    const regularItems = displayItems.filter(item => !item.adminAdded);

    // Get all products from currently displayed items (for looking up product info)
    const allProductsMap = initialItems.reduce((map, item) => {
        map[item.product.id] = item.product;
        return map;
    }, {} as Record<string, OrderItem['product']>);

    // Create temporary objects for newly added items for display purposes
    const newItemsForDisplay: NewOrderItem[] = newItems.map(newItem => {
        // Use the stored product info or fall back to allProductsMap lookup
        const productInfo = newItem.product || allProductsMap[newItem.productId];

        return {
            // Use a temporary ID format to distinguish from real IDs
            id: `new-${newItem.productId}`,
            quantity: newItem.quantity,
            price: productInfo?.price || 0,
            product: {
                id: newItem.productId,
                name: productInfo?.name || "New Product",
                price: productInfo?.price || 0,
                thumbnail: productInfo?.thumbnail,
                hidePrice: productInfo?.hidePrice || false,
                negotiablePrice: productInfo?.negotiablePrice || false
            },
            isNewItem: true
        };
    });

    // Calculate the quantity for display (using updated quantity if available)
    const getItemQuantity = (item: OrderItem) => {
        return updatedItems[item.id]?.quantity !== undefined
            ? updatedItems[item.id].quantity
            : item.quantity;
    };

    // Try to find product details for newly added items
    displayItems.forEach(item => {
        allProductsMap[item.product.id] = item.product;
    });

    // Check if any newly added item has hidden price
    const hasHiddenPriceNewItems = newItems.some(item => {
        // Use the stored product info directly or fall back to the map
        return item.product?.hidePrice || allProductsMap[item.productId]?.hidePrice;
    });

    const updateQuantity = (itemId: string, delta: number) => {
        setUpdatedItems(prev => {
            const currentItem = prev[itemId] || {
                quantity: initialItems.find(item => item.id === itemId)?.quantity || 0,
                removed: false
            };

            // Calculate new quantity, ensuring it's at least 1
            const newQuantity = Math.max(1, currentItem.quantity + delta);

            // Only track changes that differ from the original quantity
            const originalQuantity = initialItems.find(item => item.id === itemId)?.quantity || 0;

            if (newQuantity === originalQuantity && !currentItem.removed) {
                // If we're back to the original quantity and not removed, remove tracking for this item
                const newUpdatedItems = { ...prev };
                delete newUpdatedItems[itemId];
                return newUpdatedItems;
            }

            return {
                ...prev,
                [itemId]: {
                    ...currentItem,
                    quantity: newQuantity
                }
            };
        });
    };

    const removeItem = (itemId: string) => {
        setUpdatedItems(prev => ({
            ...prev,
            [itemId]: {
                quantity: initialItems.find(item => item.id === itemId)?.quantity || 0,
                removed: true
            }
        }));
    };

    const handleAddItem = (product: Product, quantity: number) => {
        // Check if it's an existing product that was removed
        const existingItem = initialItems.find(item => item.product.id === product.id);

        if (existingItem) {
            if (updatedItems[existingItem.id]?.removed) {
                // Un-remove the item and update its quantity
                setUpdatedItems(prev => ({
                    ...prev,
                    [existingItem.id]: {
                        quantity: quantity,
                        removed: false
                    }
                }));
                toast.success(`${product.name} restored to order with quantity ${quantity}`);
            } else {
                // Update the quantity of the existing item
                setUpdatedItems(prev => ({
                    ...prev,
                    [existingItem.id]: {
                        quantity: quantity,
                        removed: false
                    }
                }));
                toast.success(`${product.name} quantity updated to ${quantity}`);
            }
        } else {
            // Check if we already added this product in the current session
            const existingNewItemIndex = newItems.findIndex(item => item.productId === product.id);

            if (existingNewItemIndex >= 0) {
                // Update the quantity of the already added new item
                setNewItems(prev => {
                    const updated = [...prev];
                    updated[existingNewItemIndex] = {
                        ...updated[existingNewItemIndex],
                        quantity: quantity,
                        // Always ensure product info is saved
                        product: {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            hidePrice: product.hidePrice,
                            negotiablePrice: product.negotiablePrice,
                            thumbnail: product.thumbnail
                        }
                    };
                    return updated;
                });
                toast.success(`${product.name} quantity updated to ${quantity}`);
            } else {
                // Add as a new item with full product info
                setNewItems(prev => [
                    ...prev,
                    {
                        productId: product.id,
                        quantity: quantity,
                        product: {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            hidePrice: product.hidePrice,
                            negotiablePrice: product.negotiablePrice,
                            thumbnail: product.thumbnail
                        }
                    }
                ]);
                toast.success(`${product.name} added to order`);
            }
        }

        setIsAddProductDialogOpen(false);
    };

    const cancelChanges = () => {
        setUpdatedItems({});
        setNewItems([]);
    };

    const saveChanges = async (submitForReview = false, acceptChanges = false) => {
        // Set submission mode based on the parameter

        setIsSubmitting(true);
        try {
            // Format the data for API call
            const itemUpdates = Object.entries(updatedItems).map(([id, data]) => ({
                id,
                quantity: data.quantity,
                removed: data.removed
            }));

            // Convert new items for API
            const newItemsForApi = newItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }));

            // If there are updates, make the API call
            if (itemUpdates.length > 0 || newItemsForApi.length > 0) {
                const result = await orderService.updateCustomerOrderItems(orderId, {
                    items: itemUpdates.length > 0 ? itemUpdates : undefined,
                    newItems: newItemsForApi.length > 0 ? newItemsForApi : undefined,
                    submitForReview,
                    acceptChanges, // New parameter to combine save and accept
                    note // Include the note when there are item changes as well
                });

                // Reset state after successful save
                setUpdatedItems({});
                setNewItems([]);
                setNote('');

                // If status changed, reload the page to show new status
                if (result.statusChanged) {
                    toast.success(result.message);
                    window.location.reload();
                    return;
                }

                toast.success('Changes saved successfully');
            } else if (acceptChanges) {
                // If no item changes but customer wants to accept
                await orderService.updateCustomerOrderStatus(orderId, 'PENDING', note);
                toast.success('Order accepted successfully');
                window.location.reload();
            } else {
                toast.info('No changes to save');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save changes');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        setIsSubmitting(true);
        try {
            await orderService.updateCustomerOrderStatus(orderId, 'REJECTED', note);
            toast.success('Order rejected successfully');
            window.location.reload();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to reject order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeNewItem = (index: number) => {
        setNewItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateNewItemQuantity = (index: number, delta: number) => {
        setNewItems(prev => {
            const newArr = [...prev];
            newArr[index] = {
                ...newArr[index],
                quantity: Math.max(1, newArr[index].quantity + delta)
            };
            return newArr;
        });
    };


    return (
        <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Order Items</CardTitle>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsAddProductDialogOpen(true)}
                        size="sm"
                    >
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Admin Added Items Section */}
                {adminAddedItems.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-medium text-gray-800 mb-2">Admin Added Items</h3>
                        <div className="space-y-4">
                            {adminAddedItems.map(item => {
                                const originalPrice = getOriginalValue<number>(item.originalValues, 'price');
                                const originalQuantity = getOriginalValue<number>(item.originalValues, 'quantity');
                                const priceNote = getOriginalNote(item.originalValues, 'price');
                                const quantityNote = getOriginalNote(item.originalValues, 'quantity');

                                return (
                                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                            {item.product.thumbnail && (
                                                <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
                                                    <img
                                                        src={item.product.thumbnail.url}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium">{item.product.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    Quantity: {getItemQuantity(item)}
                                                    {item.adminAdded && (
                                                        <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-800">Admin Added</Badge>
                                                    )}
                                                    {item.quantityEdited && originalQuantity !== undefined && (
                                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md font-medium ml-1">
                                                            Original: {originalQuantity}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.quantityEdited && quantityNote && (
                                                    <p className="text-xs italic text-gray-600 mt-1">
                                                        Note: {quantityNote}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">
                                                {formatPrice(item.price * getItemQuantity(item))}
                                            </div>
                                            {item.priceEdited && originalPrice !== undefined && (
                                                <div className="text-xs text-gray-500">
                                                    Original: {formatPrice(originalPrice)}
                                                </div>
                                            )}
                                            {item.priceEdited && priceNote && (
                                                <p className="text-xs italic text-gray-600 mt-1">
                                                    Note: {priceNote}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Customer Added/Modified Items */}
                {regularItems.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-800 mb-2">Your Items</h3>
                        {regularItems.map(item => {
                            const originalPrice = getOriginalValue<number>(item.originalValues, 'price');
                            const originalQuantity = getOriginalValue<number>(item.originalValues, 'quantity');
                            const priceNote = getOriginalNote(item.originalValues, 'price');
                            const quantityNote = getOriginalNote(item.originalValues, 'quantity');

                            return (
                                <div key={item.id} className="flex flex-col p-3 border rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {item.product.thumbnail && (
                                                <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
                                                    <img
                                                        src={item.product.thumbnail.url}
                                                        alt={item.product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium">{item.product.name}</div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {item.product.negotiablePrice && (
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md font-medium">
                                                            Negotiable
                                                        </span>
                                                    )}
                                                    {item.product.hidePrice && (
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                                                            Hidden Price
                                                        </span>
                                                    )}
                                                    {item.quantityEdited && (
                                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md font-medium">
                                                            Updated
                                                        </span>
                                                    )}
                                                </div>
                                                {item.quantityEdited && originalQuantity !== undefined && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Original quantity: {originalQuantity}
                                                        {quantityNote && <span className="italic"> - Note: {quantityNote}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">
                                                {formatPrice(item.price * getItemQuantity(item))}
                                            </div>
                                            {item.priceEdited && originalPrice !== undefined && (
                                                <div className="text-xs text-gray-500">
                                                    Original price: {formatPrice(originalPrice)}
                                                    {priceNote && <div className="italic">Note: {priceNote}</div>}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateQuantity(item.id, -1)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="px-4">{getItemQuantity(item)}</span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateQuantity(item.id, 1)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Newly Added Items Section */}
                {newItemsForDisplay.length > 0 && (
                    <div className="space-y-4 mt-6">
                        <h3 className="font-medium text-gray-800 mb-2">New Items</h3>
                        {newItemsForDisplay.map((item, index) => (
                            <div key={item.id} className="flex flex-col p-3 border rounded-lg space-y-2 border-blue-200 bg-blue-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {item.product.thumbnail && (
                                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
                                                <img
                                                    src={item.product.thumbnail.url}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium flex items-center">
                                                {item.product.name}
                                                <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">New</Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {item.product.negotiablePrice && (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md font-medium">
                                                        Negotiable
                                                    </span>
                                                )}
                                                {item.product.hidePrice && (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                                                        Hidden Price
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">
                                            {item.product.hidePrice
                                                ? 'Price on request'
                                                : formatPrice(item.price * item.quantity)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateNewItemQuantity(index, -1)}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="px-4">{item.quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => updateNewItemQuantity(index, 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => removeNewItem(index)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No Items Message */}
                {regularItems.length === 0 && newItemsForDisplay.length === 0 && adminAddedItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No items in this order. Add items to continue.
                    </div>
                )}

                {/* Actions */}
                {hasChanges ? (
                    <div className="mt-6 flex flex-col gap-4">
                        {!hasHiddenPriceNewItems && (
                            <PaymentMethod id="payment-cash-edit" />
                        )}

                        <div>
                            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                                Add a note (optional)
                            </label>
                            <textarea
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add any notes about your changes..."
                                className="w-full p-2 border rounded-md text-sm"
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={cancelChanges}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>

                            {hasHiddenPriceNewItems ? (
                                <Button
                                    variant="outline"
                                    onClick={() => saveChanges(true)}
                                    disabled={isSubmitting}
                                    className="bg-blue-500 text-white hover:bg-blue-600"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => saveChanges(false, true)}
                                    disabled={isSubmitting}
                                    className="bg-green-500 text-white hover:bg-green-600"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Save and Accept Changes'}
                                </Button>
                            )}
                        </div>

                        <div className="text-xs text-gray-500 italic">
                            {hasHiddenPriceNewItems
                                ? 'You have added items with hidden prices. This will send your order for admin review.'
                                : 'Clicking "Accept Changes" will approve all changes and submit your order.'}
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 flex flex-col gap-4">
                        <PaymentMethod id="payment-cash-accept" />

                        <div>
                            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                                Add a note (optional)
                            </label>
                            <textarea
                                id="note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add any notes about your decision..."
                                className="w-full p-2 border rounded-md text-sm"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => saveChanges(false, true)}
                                disabled={isSubmitting}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Accept Order
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Reject Order
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>

            <CustomerAddProductDialog
                isOpen={isAddProductDialogOpen}
                onClose={() => setIsAddProductDialogOpen(false)}
                onAddItem={handleAddItem}
                existingProductIds={[
                    ...initialItems.filter(item => !updatedItems[item.id]?.removed).map(item => item.product.id),
                    ...newItems.map(item => item.productId)
                ]}
            />
        </Card>
    );
} 