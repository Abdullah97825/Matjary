"use client";

import { createContext, useContext, useState } from 'react';
import { CartItemWithProduct, SerializedCartItem } from '@/types/cart';

interface CartContextType {
  isUpdating: boolean;
  setIsUpdating: (isUpdating: boolean) => void;
  subtotal: number;
  setSubtotal: (subtotal: number) => void;
  items: SerializedCartItem[];
  setItems: (items: SerializedCartItem[]) => void;
}

interface CartProviderProps {
  children: React.ReactNode;
  initialSubtotal: number;
  initialItems: SerializedCartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children, initialSubtotal, initialItems }: CartProviderProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [subtotal, setSubtotal] = useState(initialSubtotal);
  const [items, setItems] = useState<SerializedCartItem[]>(initialItems);

  return (
    <div className="relative">
      <CartContext.Provider value={{ 
        isUpdating, 
        setIsUpdating,
        subtotal,
        setSubtotal,
        items,
        setItems
      }}>
        {children}
      </CartContext.Provider>

      {isUpdating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
        </div>
      )}
    </div>
  );
}