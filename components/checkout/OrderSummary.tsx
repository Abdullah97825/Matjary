"use client";

import { useState } from 'react';
import { SerializedCartItem } from '@/types/cart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/utils/format';
import { calculateDiscountedPrice } from '@/utils/price';
import { hasNegotiableOrHiddenPriceItems } from '@/utils/cart';
import { PromoCodeInput, ValidatedPromoCode } from '@/components/checkout/PromoCodeInput';

interface OrderSummaryProps {
  items: SerializedCartItem[];
  subtotal: number;
  onPromoCodeValidated?: (promoCode: ValidatedPromoCode | null) => void;
}

export function OrderSummary({ items, subtotal, onPromoCodeValidated }: OrderSummaryProps) {
  const hasSpecialPriceItems = hasNegotiableOrHiddenPriceItems(items);
  const [promoCode, setPromoCode] = useState<ValidatedPromoCode | null>(null);

  // Calculate final total after discount
  const total = !hasSpecialPriceItems && promoCode
    ? Math.max(0, subtotal - promoCode.discountAmount)
    : subtotal;

  const handlePromoCodeValidated = (code: ValidatedPromoCode | null) => {
    setPromoCode(code);
    if (onPromoCodeValidated) {
      onPromoCodeValidated(code);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 py-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                <img
                  src={item.product.thumbnail?.url || '/images/placeholder.svg'}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                  <div className="flex items-center gap-2">
                    {item.product.hidePrice ? (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                        Contact for Price
                      </span>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(calculateDiscountedPrice(item.product) * item.quantity)}
                        </p>
                        {item.product.discountType && (
                          <p className="text-sm text-gray-500 line-through">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        )}
                        {item.product.negotiablePrice && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md font-medium">
                            Negotiable
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Display note for items with hidden price */}
        {items.some(item => item.product.hidePrice) && (
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <p className="font-medium">Note about items with hidden prices:</p>
            <ul className="list-disc pl-4 mt-1">
              <li>Items with hidden pricing will have quotes provided by our team</li>
              <li>Please contact us for pricing information on these items</li>
            </ul>
          </div>
        )}

        {/* Display note for negotiable items */}
        {items.some(item => item.product.negotiablePrice) && !items.some(item => item.product.hidePrice) && (
          <div className="text-xs text-gray-500 bg-green-50 p-2 rounded">
            <p className="font-medium">Note about negotiable items:</p>
            <ul className="list-disc pl-4 mt-1">
              <li>The displayed prices are our starting prices</li>
              <li>Final pricing will be confirmed after your order request</li>
            </ul>
          </div>
        )}

        {/* Show what happens next if there are special price items */}
        {hasSpecialPriceItems && (
          <div className="text-xs text-gray-700 bg-yellow-50 p-2 rounded mt-2">
            <p className="font-medium">What happens next:</p>
            <ol className="list-decimal pl-4 mt-1 space-y-1">
              <li>You&apos;ll submit your order request</li>
              <li>Our team will review your items and prepare a quote</li>
              <li>We&apos;ll send you a final order with detailed pricing for approval</li>
              <li>You&apos;ll confirm or decline the final order</li>
            </ol>
          </div>
        )}

        {/* Add Promo Code Input */}
        <div className="pt-4 border-t">
          <PromoCodeInput
            subtotal={subtotal}
            onValidPromoCode={handlePromoCodeValidated}
            hasSpecialPriceItems={hasSpecialPriceItems}
          />
        </div>

        {/* Only show total for non-special price items */}
        {!hasSpecialPriceItems ? (
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            {promoCode && (
              <div className="flex justify-between text-green-600 mt-2">
                <span>Promo Discount</span>
                <span>- {formatPrice(promoCode.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between font-medium text-lg mt-2">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        ) : (
          <div className="border-t pt-4 text-center">
            <span className="text-sm text-gray-500 italic">Price to be determined after review</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}