"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCartIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { CART_UPDATED_EVENT } from '@/utils/events';

interface AddToCartButtonProps {
  productId: string;
  inStock: boolean;
  maxStock?: number;
  hideStock?: boolean;
}

export function AddToCartButton({ productId, inStock, maxStock }: AddToCartButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Set the maximum allowed quantity (either maxStock if provided, or 99 as a reasonable default)
  const maxQuantity = maxStock !== undefined ? maxStock : 99;

  const incrementQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
      setQuantity(value);
    }
  };

  const addToCart = async () => {
    if (!inStock) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add item to cart');
      }

      // Dispatch cart update event
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));

      toast.success(data.message || `${quantity} ${quantity === 1 ? 'item' : 'items'} added to cart`);
      router.refresh();
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  };

  if (!inStock) {
    return (
      <button
        disabled
        className="flex w-full items-center justify-center rounded-lg px-6 py-3 text-sm font-medium cursor-not-allowed bg-gray-200 text-gray-500"
      >
        <ShoppingCartIcon className="mr-2 h-5 w-5" aria-hidden="true" />
        Out of Stock
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <label htmlFor="quantity" className="mr-3 text-sm font-medium text-gray-700">
          Quantity:
        </label>
        <div className="flex items-center border border-gray-300 rounded-md">
          <button
            type="button"
            className="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <MinusIcon className="h-4 w-4" />
          </button>

          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            max={maxQuantity}
            value={quantity}
            onChange={handleQuantityChange}
            className="w-12 border-0 text-center focus:ring-0 p-0 text-gray-900 [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
          />

          <button
            type="button"
            className="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300"
            onClick={incrementQuantity}
            disabled={quantity >= maxQuantity}
            aria-label="Increase quantity"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        onClick={addToCart}
        disabled={isLoading}
        className="flex w-full items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition-colors
          bg-gray-900 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200"
      >
        <ShoppingCartIcon className="mr-2 h-5 w-5" aria-hidden="true" />
        {isLoading ? 'Adding...' : `Add to Cart${quantity > 1 ? ` (${quantity})` : ''}`}
      </button>
    </div>
  );
} 