'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/format';
import { orderService } from '@/services/order';
import { CustomerAddProductDialog, Product } from '@/components/customer/AddProductDialog';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    priceEdited?: boolean;
    quantityEdited?: boolean;
    originalValues?: string;
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

interface CustomerItemManagementProps {
    orderId: string;
    items: OrderItem[];
    onItemsUpdated: () => void;
}

export function CustomerItemManagement({ orderId, items, onItemsUpdated }: CustomerItemManagementProps) {
    const [updatedItems, setUpdatedItems] = useState<Record<string, { quantity: number; removed: boolean }>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
    const [newItems, setNewItems] = useState<Array<{ productId: string; quantity: number }>>([]);

    const hasChanges = Object.keys(updatedItems).length > 0 || newItems.length > 0;

    // Filter out removed items for UI display
    const displayItems = items.filter(item => !updatedItems[item.id]?.removed);

    // Calculate the quantity for display (using updated quantity if available)
    const getItemQuantity = (item: OrderItem) => {
        return updatedItems[item.id]?.quantity !== undefined
            ? updatedItems[item.id].quantity
            : item.quantity;
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setUpdatedItems(prev => {
            const currentItem = prev[itemId] || {
                quantity: items.find(item => item.id === itemId)?.quantity || 0,
                removed: false
            };

            // Calculate new quantity, ensuring it's at least 1
            const newQuantity = Math.max(1, currentItem.quantity + delta);

            // Only track changes that differ from the original quantity
            const originalQuantity = items.find(item => item.id === itemId)?.quantity || 0;

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
                quantity: items.find(item => item.id === itemId)?.quantity || 0,
                removed: true
            }
        }));
    };

    const handleAddItem = (product: Product, quantity: number) => {
        // Check if it's an existing product that was removed
        const existingItem = items.find(item => item.product.id === product.id);

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
            } else {
                // Update the quantity of the existing item
                setUpdatedItems(prev => ({
                    ...prev,
                    [existingItem.id]: {
                        quantity: quantity,
                        removed: false
                    }
                }));
            }
        } else {
            // Check if we already added this product in the current session
            const existingNewItem = newItems.findIndex(item => item.productId === product.id);

            if (existingNewItem >= 0) {
                // Update the quantity of the already added new item
                setNewItems(prev => {
                    const updated = [...prev];
                    updated[existingNewItem] = {
                        ...updated[existingNewItem],
                        quantity: quantity
                    };
                    return updated;
                });
            } else {
                // Add as a new item
                setNewItems(prev => [
                    ...prev,
                    {
                        productId: product.id,
                        quantity: quantity
                    }
                ]);
            }
        }

        setIsAddProductDialogOpen(false);
        toast.success(`${product.name} added to order`);
    };

    const cancelChanges = () => {
        setUpdatedItems({});
        setNewItems([]);
    };

    const saveChanges = async () => {
        setIsSubmitting(true);
        try {
            // Format the data for API call
            const itemUpdates = Object.entries(updatedItems).map(([id, data]) => ({
                id,
                quantity: data.quantity,
                removed: data.removed
            }));

            await orderService.updateCustomerOrderItems(orderId, {
                items: itemUpdates.length > 0 ? itemUpdates : undefined,
                newItems: newItems.length > 0 ? newItems : undefined
            });

            toast.success('Order items updated successfully');
            setUpdatedItems({});
            setNewItems([]);

            // Refresh the order data
            onItemsUpdated();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update order items');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get all product IDs that are in the order (including newly added ones)
    const existingProductIds = [
        ...items.map(item => item.product.id),
        ...newItems.map(item => item.productId)
    ];

    return (
        <Card className="mt-8">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Modify Order Items</CardTitle>
                <Button
                    variant="outline"
                    onClick={() => setIsAddProductDialogOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </CardHeader>
            <CardContent>
                {/* Existing order items */}
                <div className="space-y-4 mb-6">
                    {displayItems.length === 0 && newItems.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                            No items in this order
                        </div>
                    ) : (
                        <>
                            {displayItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border">
                                            <img
                                                src={item.product.thumbnail?.url || '/images/placeholder.svg'}
                                                alt={item.product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium">{item.product.name}</p>
                                            <p className="text-sm text-gray-500">{formatPrice(Number(item.price))}</p>
                                            <div className="flex gap-2 mt-1">
                                                {item.priceEdited && (
                                                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                                                        Price Modified
                                                    </Badge>
                                                )}
                                                {item.product.negotiablePrice && (
                                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                                        Negotiable
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center border rounded-md">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateQuantity(item.id, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center">{getItemQuantity(item)}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => updateQuantity(item.id, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {/* Action buttons */}
                            <div className="flex justify-end gap-2 mt-4">
                                {hasChanges && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={cancelChanges}
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="default"
                                            onClick={saveChanges}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                                            Save Changes
                                        </Button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </CardContent>

            {/* Product search dialog */}
            <CustomerAddProductDialog
                isOpen={isAddProductDialogOpen}
                onClose={() => setIsAddProductDialogOpen(false)}
                onAddItem={handleAddItem}
                existingProductIds={existingProductIds}
            />
        </Card>
    );
} 