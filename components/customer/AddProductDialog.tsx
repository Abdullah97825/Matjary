'use client';

import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatPrice } from '@/utils/format';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { orderService } from '@/services/order';

export interface Product {
    id: string;
    name: string;
    price: number;
    thumbnail?: {
        url: string;
    };
    negotiablePrice?: boolean;
    hidePrice?: boolean;
    stock?: number;
    hideStock?: boolean;
}

interface AddProductDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAddItem: (product: Product, quantity: number) => void;
    existingProductIds: string[];
    adminAddedProductIds?: string[];
}

export function CustomerAddProductDialog({
    isOpen,
    onClose,
    onAddItem,
    existingProductIds,
    adminAddedProductIds
}: AddProductDialogProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Product[]>([]);
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

    // Initialize quantities for all products to 1
    useEffect(() => {
        const quantities: Record<string, number> = {};
        results.forEach(product => {
            quantities[product.id] = 1;
        });
        setSelectedQuantities(quantities);
    }, [results]);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await orderService.searchProducts(query);

                // In the context of editing an existing order, we shouldn't filter out any products
                setResults(data.products);
            } catch (error) {
                console.error('Error searching products:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchProducts, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleAddItem = (product: Product) => {
        const quantity = selectedQuantities[product.id] || 1;
        onAddItem(product, quantity);
    };

    const updateQuantity = (productId: string, quantity: number) => {
        setSelectedQuantities(prev => ({
            ...prev,
            [productId]: quantity
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="h-[600px] flex flex-col gap-0 sm:max-w-2xl">
                <DialogHeader className="px-4 py-2">
                    <DialogTitle>Add Product to Order</DialogTitle>
                    <DialogDescription>
                        Search for products to add to this order
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden px-4">
                    {/* Search input with loading indicator */}
                    <div className="flex items-center gap-2 py-2">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Search products..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pr-8"
                            />
                            {loading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <LoadingSpinner size="sm" />
                                </div>
                            )}
                        </div>
                        <Button
                            variant="secondary"
                            size="icon"
                            disabled={loading}
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Results container with fixed height */}
                    <div className="overflow-y-auto h-[calc(600px-180px)] rounded-md border">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : results.length > 0 ? (
                            <div className="divide-y">
                                {results.map((product) => {
                                    const isInOrder = existingProductIds.includes(product.id);
                                    const isAdminAdded = adminAddedProductIds?.includes(product.id);

                                    return (
                                        <div
                                            key={product.id}
                                            className={cn(
                                                "flex items-start justify-between p-4 hover:bg-accent",
                                                isInOrder && "bg-yellow-50/50",
                                                isAdminAdded && "bg-green-50/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                                                    <img
                                                        src={product.thumbnail?.url || '/images/placeholder.svg'}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{product.name}</p>
                                                    {product.hidePrice ? (
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                                                            Price Requires Review
                                                        </span>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">{formatPrice(product.price)}</p>
                                                    )}
                                                    {product.stock !== undefined && !product.hideStock && (
                                                        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                                                    )}
                                                    <div className="flex gap-2 mt-1">
                                                        {product.hidePrice && (
                                                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                                                Admin Review Required
                                                            </Badge>
                                                        )}
                                                        {product.negotiablePrice && (
                                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                                                Negotiable
                                                            </Badge>
                                                        )}
                                                        {isInOrder && (
                                                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                                                                Already in order
                                                            </Badge>
                                                        )}
                                                        {isAdminAdded && (
                                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                                                Admin Added
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={selectedQuantities[product.id] || 1}
                                                        onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                                                        className="text-center"
                                                    />
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAddItem(product)}
                                                    variant={isInOrder ? "outline" : "default"}
                                                    className={isInOrder ? "border-yellow-400 hover:bg-yellow-50" : ""}
                                                    disabled={isAdminAdded}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    {isAdminAdded ? 'Admin Only' : isInOrder ? 'Update' : 'Add'}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : query.length >= 2 ? (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                                <p>No products found</p>
                                <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                                <p>Start typing to search products</p>
                                <p className="text-sm text-gray-500 mt-1">Enter at least 2 characters</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 