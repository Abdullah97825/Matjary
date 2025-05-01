'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getValidStatusTransitions } from '@/utils/order';
import { orderService } from '@/services/order';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { OrderStatus } from '@prisma/client';
import { PaymentMethod } from '@/components/order/paymentMethod';

export interface CustomerActionsProps {
    orderId: string;
    status: OrderStatus;
    hasUnsavedChanges?: boolean;
}

export function CustomerActions({ orderId, status, hasUnsavedChanges = false }: CustomerActionsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [note, setNote] = useState('');

    const validTransitions = getValidStatusTransitions(status, 'CUSTOMER');

    // Don't show anything if there are no valid actions
    if (validTransitions.length === 0) {
        return null;
    }

    // Only Customer Pending orders need actions
    if (status !== 'CUSTOMER_PENDING') {
        return null;
    }

    // If there are unsaved changes, don't show the component since 
    // the CustomerItemEditor will have its own combined accept functionality
    if (hasUnsavedChanges) {
        return null;
    }

    const handleStatusChange = async (newStatus: 'PENDING' | 'REJECTED') => {
        setIsSubmitting(true);
        try {
            await orderService.updateCustomerOrderStatus(orderId, newStatus, note);
            toast.success(`Order ${newStatus === 'PENDING' ? 'accepted. Awaiting store confirmation.' : 'rejected'} successfully`);
            // Reload the page to show updated status
            window.location.reload();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update order status');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Review Order</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert className="mb-4">
                    <AlertTitle>Action required</AlertTitle>
                    <AlertDescription>
                        Please review this order and either accept or reject it. This action cannot be undone.
                    </AlertDescription>
                </Alert>

                {hasUnsavedChanges && (
                    <Alert className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
                        <AlertTitle>Unsaved Changes</AlertTitle>
                        <AlertDescription>
                            You have unsaved changes to your order items. Please save or cancel your changes before accepting or rejecting this order.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    {validTransitions.includes('PENDING') && (
                        <PaymentMethod id="payment-cash-actions" />
                    )}

                    <div>
                        <Textarea
                            placeholder="Add a note (optional)"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="mb-4"
                        />
                    </div>

                    <div className="flex gap-2">
                        {validTransitions.includes('PENDING') && (
                            <Button
                                onClick={() => handleStatusChange('PENDING')}
                                disabled={isSubmitting || hasUnsavedChanges}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Accept Order
                            </Button>
                        )}

                        {validTransitions.includes('REJECTED') && (
                            <Button
                                variant="destructive"
                                onClick={() => handleStatusChange('REJECTED')}
                                disabled={isSubmitting || hasUnsavedChanges}
                                className="flex-1"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Reject Order
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 