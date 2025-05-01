import { toast } from "sonner";

export function useCartError() {
  const handleCartError = (error: unknown, fallbackMessage: string) => {
    console.error('Cart error:', error);
    toast.error(error instanceof Error ? error.message : fallbackMessage);
  };

  return { handleCartError };
} 