import { AddToCartData, UpdateCartItemData, CartResponse } from "@/types/cart"
import { emitCartUpdated } from "@/utils/events"

export const cartService = {
  getCart: async (): Promise<CartResponse> => {
    const response = await fetch('/api/cart');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch cart');
    }
    
    return data;
  },

  addItem: async (data: AddToCartData): Promise<CartResponse> => {
    const response = await fetch('/api/cart/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to add item to cart');
    }
    
    emitCartUpdated();
    return result;
  },

  updateItem: async (data: UpdateCartItemData): Promise<CartResponse> => {
    const response = await fetch(`/api/cart/items?itemId=${data.cartItemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity: data.quantity }),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update item');
    }
    
    emitCartUpdated();
    return result;
  },

  removeItem: async (itemId: string): Promise<CartResponse> => {
    const response = await fetch(`/api/cart/items?itemId=${itemId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to remove item');
    }
    
    emitCartUpdated();
    return result;
  },

  clearCart: async (): Promise<CartResponse> => {
    const response = await fetch('/api/cart', {
      method: 'DELETE',
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to clear cart');
    }
    
    emitCartUpdated();
    return result;
  },
} 