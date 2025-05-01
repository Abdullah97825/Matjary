"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cartService } from '@/services/cart';
import { useCart } from '@/contexts/CartContext';
import { SerializedCartItem } from '@/types/cart';
import { useCartItem } from '@/hooks/useCartItem';
import { useCartError } from '@/hooks/useCartError';
import { formatPrice } from '@/utils/format';
import { calculateSubtotal, dispatchCartUpdate, convertPrice } from '@/utils/cart';
import { calculateDiscountedPrice, getDiscountLabel } from '@/utils/price';

interface CartItemsProps {
  isSheet?: boolean;
  onContinueShopping?: () => void;
}

export function CartItems({ isSheet = false, onContinueShopping }: CartItemsProps) {
  const router = useRouter();
  const { setIsUpdating, setSubtotal, items, setItems } = useCart();
  const { setItemLoading, isItemLoading } = useCartItem();
  const { handleCartError } = useCartError();

  const handleQuantityChange = async (item: SerializedCartItem, newQuantity: string) => {
    const quantity = parseInt(newQuantity, 10);
    if (isNaN(quantity) || quantity < 1) return;

    setItemLoading(item.id, true);
    setIsUpdating(true);

    try {
      await cartService.updateItem({
        cartItemId: item.id,
        quantity: quantity
      });

      const updatedItems = items.map(i =>
        i.id === item.id ? { ...i, quantity } : i
      );
      setItems(updatedItems);
      setSubtotal(calculateSubtotal(updatedItems));
      dispatchCartUpdate();
    } catch (error) {
      handleCartError(error, "Failed to update cart item");
    } finally {
      setItemLoading(item.id, false);
      setIsUpdating(false);
      router.refresh();
    }
  };

  const removeItem = async (itemId: string) => {
    setItemLoading(itemId, true);
    setIsUpdating(true);

    try {
      await cartService.removeItem(itemId);
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);
      setSubtotal(calculateSubtotal(updatedItems));
      dispatchCartUpdate();
    } catch (error) {
      handleCartError(error, "Failed to remove item");
    } finally {
      setItemLoading(itemId, false);
      setIsUpdating(false);
      router.refresh();
    }
  };

  if (items.length === 0) {
    return (
      <div className={isSheet ? "p-4" : ""}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Your cart is empty</p>
              <Link
                href="/store"
                className="text-sm text-blue-600 hover:underline"
                onClick={(e) => {
                  if (onContinueShopping) {
                    e.preventDefault();
                    onContinueShopping();
                  }
                }}
              >
                Continue shopping
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ItemWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isSheet) {
      return <div className="divide-y">{children}</div>;
    }
    return <div className="space-y-4">{children}</div>;
  };

  const renderCartItem = (item: SerializedCartItem) => {
    // Update image selection to use thumbnail first
    const imageUrl = item.product.thumbnail?.url ||
      item.product.images[0]?.url ||
      '/images/placeholder.svg';
    const originalPrice = convertPrice(item.product.price);
    const discountedPrice = calculateDiscountedPrice(item.product);
    const discountLabel = getDiscountLabel(item.product);

    if (isSheet) {
      return (
        <div key={item.id} className="flex gap-4 py-4">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
            <img
              src={imageUrl}
              alt={item.product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col justify-between">
            <div className="flex justify-between">
              <div>
                <Link
                  href={`/products/${item.product.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-gray-800"
                >
                  {item.product.name}
                </Link>
                <div className="mt-1">
                  {item.product.hidePrice ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                      Contact for Price
                    </span>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900">
                          {formatPrice(discountedPrice)}
                        </p>
                        {discountedPrice < originalPrice && (
                          <p className="text-sm text-gray-500 line-through">
                            {formatPrice(originalPrice)}
                          </p>
                        )}
                        {discountLabel && (
                          <span className="text-xs text-red-500">
                            {discountLabel}
                          </span>
                        )}
                      </div>
                      {item.product.negotiablePrice && (
                        <div className="mt-1">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md font-medium">
                            Negotiable
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item, e.target.value)}
                  className="w-20"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  disabled={isItemLoading(item.id)}
                  className="hover:bg-red-600"
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Card key={item.id}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
              <img
                src={imageUrl}
                alt={item.product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between">
                <div>
                  <Link
                    href={`/products/${item.product.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-gray-800"
                  >
                    {item.product.name}
                  </Link>
                  <div className="mt-1">
                    {item.product.hidePrice ? (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                        Contact for Price
                      </span>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-900">
                            {formatPrice(discountedPrice)}
                          </p>
                          {discountedPrice < originalPrice && (
                            <p className="text-sm text-gray-500 line-through">
                              {formatPrice(originalPrice)}
                            </p>
                          )}
                          {discountLabel && (
                            <span className="text-xs text-red-500">
                              {discountLabel}
                            </span>
                          )}
                        </div>
                        {item.product.negotiablePrice && (
                          <div className="mt-1">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md font-medium">
                              Negotiable
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item, e.target.value)}
                    className="w-20"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={isItemLoading(item.id)}
                    className="hover:bg-red-600"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ItemWrapper>
      {items.map(renderCartItem)}
    </ItemWrapper>
  );
}