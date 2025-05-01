"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2Icon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCart } from '@/contexts/CartContext';
import { cartService } from '@/services/cart';
import { CART_UPDATED_EVENT } from '@/utils/events';

interface ClearCartButtonProps {
  itemCount: number;
}

export function ClearCartButton({ itemCount }: ClearCartButtonProps) {
  const router = useRouter();
  const { setIsUpdating, setSubtotal, setItems } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const handleClearCart = async () => {
    setIsLoading(true);
    setIsUpdating(true);

    try {
      await cartService.clearCart();
      
      // Only update UI after successful API call
      setSubtotal(0);
      setItems([]);
      
      // Dispatch event to update cart button
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      
      toast.success('Cart cleared successfully');
      router.refresh();
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    } finally {
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="w-full flex items-center justify-center gap-2 hover:bg-red-600"
          disabled={itemCount === 0}
        >
          <Trash2Icon className="h-4 w-4" />
          Clear Cart
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear Cart</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove all items from your cart? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClearCart}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Clearing...' : 'Clear Cart'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 