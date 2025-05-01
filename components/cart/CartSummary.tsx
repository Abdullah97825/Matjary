"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { ClearCartButton } from './ClearCartButton';
import { formatPrice } from '@/utils/format';
import { useCartError } from '@/hooks/useCartError';
import { convertPrice } from '@/utils/cart';
import { calculateDiscountedPrice } from '@/utils/price';
import { hasNegotiableOrHiddenPriceItems } from '@/utils/cart';

interface CartSummaryProps {
  itemCount: number;
}

export function CartSummary({ itemCount }: CartSummaryProps) {
  const router = useRouter();
  const { isUpdating, subtotal, items } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const { handleCartError } = useCartError();

  const hasSpecialPriceItems = hasNegotiableOrHiddenPriceItems(items);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement checkout logic
      router.push('/checkout');
    } catch (error) {
      handleCartError(error, 'Failed to process checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasSpecialPriceItems && (
          <>
            <div className="flex justify-between text-sm">
              <span>Subtotal ({itemCount} items)</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {/* Add savings display if any discounts exist */}
            {items.some(item => item.product.discountType) && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Total Savings</span>
                <span>
                  {formatPrice(
                    items.reduce((savings, item) => {
                      // Skip items with hidden price in savings calculation
                      if (item.product.hidePrice) return savings;

                      const original = convertPrice(item.product.price) * item.quantity;
                      const discounted = calculateDiscountedPrice(item.product) * item.quantity;
                      return savings + (original - discounted);
                    }, 0)
                  )}
                </span>
              </div>
            )}
          </>
        )}

        {/* Display note for items with hidden price */}
        {items.some(item => item.product.hidePrice) && (
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <p className="font-medium">Note about items with hidden prices:</p>
            <ul className="list-disc pl-4 mt-1">
              <li>Item prices will be provided during order review</li>
              <li>Contact us for immediate pricing information</li>
            </ul>
          </div>
        )}

        {/* Display note for negotiable items */}
        {items.some(item => item.product.negotiablePrice) && !items.some(item => item.product.hidePrice) && (
          <div className="text-xs text-gray-500 bg-green-50 p-2 rounded">
            <p className="font-medium">Note about negotiable items:</p>
            <ul className="list-disc pl-4 mt-1">
              <li>Prices shown are starting prices</li>
              <li>Final pricing will be confirmed after order review</li>
            </ul>
          </div>
        )}

        {hasSpecialPriceItems ? (
          <div className="border-t pt-4 text-center">
            <span className="text-sm text-gray-500 italic">Price to be determined after review</span>
          </div>
        ) : (
          <div className="flex justify-between border-t pt-4 font-medium">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <ClearCartButton itemCount={itemCount} />
        <Button
          className="w-full"
          onClick={handleCheckout}
          disabled={itemCount === 0 || isLoading || isUpdating}
        >
          {isLoading ? 'Processing...' : hasSpecialPriceItems ? 'Request Details' : 'Proceed to Checkout'}
        </Button>
      </CardFooter>
    </Card>
  );
}