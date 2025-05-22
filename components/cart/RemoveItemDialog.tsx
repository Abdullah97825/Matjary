"use client";

import { Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import { SerializedCartItem } from '@/types/cart';

interface RemoveItemDialogProps {
    item: SerializedCartItem;
    onRemove: (itemId: string) => Promise<void>;
    isLoading: boolean;
}

export function RemoveItemDialog({ item, onRemove, isLoading }: RemoveItemDialogProps) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="icon"
                    disabled={isLoading}
                    className="hover:bg-red-600"
                >
                    <Trash2Icon className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove Item</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove "{item.product.name}" from your shopping cart?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => onRemove(item.id)}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? 'Removing...' : 'Remove Item'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 