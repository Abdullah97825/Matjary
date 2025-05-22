"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CartProvider } from '@/contexts/CartContext';
import { CartItems } from '@/components/cart/CartItems';
import { ClearCartButton } from '@/components/cart/ClearCartButton';
import { cartService } from '@/services/cart';
import { CartWithItems, SerializedCartItem } from '@/types/cart';
import { useCartError } from '@/hooks/useCartError';
import { formatPrice } from '@/utils/format';
import { CART_UPDATED_EVENT } from '@/utils/events';
import { serializeCartData, hasNegotiableOrHiddenPriceItems } from '@/utils/cart';

export function CartSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<SerializedCartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { handleCartError } = useCartError();

  const fetchCartData = async () => {
    setIsLoading(true);
    try {
      const data = await cartService.getCart();
      const { serializedItems, subtotal } = serializeCartData({ items: data.items } as CartWithItems);
      setItems(serializedItems);
      setSubtotal(subtotal);
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        setError('Please log in to view your cart');
        return;
      }
      handleCartError(error, 'Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartData();
    };

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
  }, []);

  // Fetch data when sheet opens
  useEffect(() => {
    if (isOpen) {
      fetchCartData();
    }
  }, [isOpen]);

  // Initial fetch
  useEffect(() => {
    fetchCartData();
  }, []);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const hasSpecialPriceItems = hasNegotiableOrHiddenPriceItems(items);

  const allowedPaths = ['/', '/products', '/store'];
  const shouldShow = allowedPaths.some(path =>
    pathname === path || pathname.startsWith('/products/') || pathname.startsWith('/store/')
  );

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-8 left-8 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-white hover:bg-gray-50"
          >
            <ShoppingCart className="h-6 w-6 text-gray-600" />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {totalItems}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Shopping Cart ({totalItems} items)</SheetTitle>
            <SheetDescription>
              View or modify items in your shopping cart
            </SheetDescription>
          </SheetHeader>

          {error ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <CartProvider key={items.length} initialItems={items} initialSubtotal={subtotal}>
              <div className="flex h-full flex-col">
                <div className="flex-1 py-4">
                  <div className="max-h-[50vh] overflow-y-auto scrollbar scrollbar-w-2 scrollbar-thumb-primary scrollbar-track-gray-200 pr-1">
                    <CartItems
                      isSheet
                      onContinueShopping={() => {
                        setIsOpen(false);
                        router.push('/store');
                      }}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-auto">
                  {!hasSpecialPriceItems ? (
                    <div className="mb-4 flex justify-between font-medium">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                  ) : (
                    <div className="mb-4 text-center">
                      <span className="text-sm text-gray-500 italic">Price to be determined after review</span>
                    </div>
                  )}

                  {items.some(item => item.product.hidePrice) && (
                    <div className="mb-4 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                      <p className="font-medium">Note about hidden prices:</p>
                      <p className="mt-1">Item prices will be provided during order review.</p>
                    </div>
                  )}

                  {items.some(item => item.product.negotiablePrice) && !items.some(item => item.product.hidePrice) && (
                    <div className="mb-4 text-xs text-gray-500 bg-green-50 p-2 rounded">
                      <p className="font-medium">Note about negotiable items:</p>
                      <p className="mt-1">Prices shown are starting prices and will be finalized after review.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <ClearCartButton itemCount={items.length} />
                    <Button
                      className="w-full"
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/cart');
                      }}
                      disabled={items.length === 0}
                    >
                      View Cart
                    </Button>
                  </div>
                </div>
              </div>
            </CartProvider>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}