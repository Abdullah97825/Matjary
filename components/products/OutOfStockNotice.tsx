import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OutOfStockNoticeProps {
  hideStock?: boolean;
}

export function OutOfStockNotice({ hideStock = false }: OutOfStockNoticeProps) {
  if (hideStock) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Out of Stock</AlertTitle>
      <AlertDescription>
        This item is currently out of stock. Please check back later or sign up for stock notifications.
      </AlertDescription>
    </Alert>
  );
} 