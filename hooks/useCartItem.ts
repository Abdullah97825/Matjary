import { useState } from "react";

export function useCartItem() {
  const [loadingItems, setLoadingItems] = useState<Map<string, boolean>>(new Map());
  
  const setItemLoading = (itemId: string, loading: boolean) => {
    setLoadingItems(prev => {
      const next = new Map(prev);
      next.set(itemId, loading);
      return next;
    });
  };

  const isItemLoading = (itemId: string) => loadingItems.get(itemId) || false;

  return { setItemLoading, isItemLoading, loadingItems };
} 