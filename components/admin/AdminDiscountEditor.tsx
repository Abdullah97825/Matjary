'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/utils/format';
import { toast } from 'sonner';
import { orderService } from '@/services/order';

interface AdminDiscountEditorProps {
    orderId: string;
    originalTotal: number;
    currentDiscount: number | null;
    currentReason: string | null;
    onDiscountApplied: () => void;
}

export function AdminDiscountEditor({
    orderId,
    originalTotal,
    currentDiscount = 0,
    currentReason = '',
    onDiscountApplied
}: AdminDiscountEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [discount, setDiscount] = useState(currentDiscount || 0);
    const [reason, setReason] = useState(currentReason || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            // Reset to current values when starting to edit
            setDiscount(currentDiscount || 0);
            setReason(currentReason || '');
        }
    };

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        // Make sure discount doesn't exceed the original total
        if (!isNaN(value) && value >= 0 && value <= originalTotal) {
            setDiscount(value);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await orderService.updateOrderDiscount(orderId, {
                adminDiscount: discount,
                adminDiscountReason: reason,
            });

            toast.success('Discount updated successfully');
            setIsEditing(false);
            onDiscountApplied();
        } catch (error) {
            console.error('Error updating discount:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to update discount');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveDiscount = async () => {
        setIsSubmitting(true);
        try {
            await orderService.removeOrderDiscount(orderId);
            toast.success('Discount removed successfully');
            onDiscountApplied();
        } catch (error) {
            console.error('Error removing discount:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to remove discount');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setDiscount(currentDiscount || 0);
        setReason(currentReason || '');
    };

    const finalTotal = originalTotal - (discount || 0);

    return (
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md">Admin Discount</CardTitle>
                {!isEditing && !currentDiscount && (
                    <Button
                        onClick={handleEditToggle}
                        variant="outline"
                        size="sm"
                    >
                        Add Discount
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="discount">Discount Amount</Label>
                            <Input
                                id="discount"
                                type="number"
                                min="0"
                                max={originalTotal}
                                step="0.01"
                                value={discount}
                                onChange={handleDiscountChange}
                                placeholder="Enter discount amount"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Discount</Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter reason for discount"
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2 text-sm">
                            <span>Original Total:</span>
                            <span className="font-medium">{formatPrice(originalTotal)}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span>Discount:</span>
                            <span className="font-medium text-green-600">-{formatPrice(discount)}</span>
                        </div>

                        <div className="flex items-center justify-between border-t pt-2 font-medium">
                            <span>Total After Admin Discount:</span>
                            <span>{formatPrice(finalTotal)}</span>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                            <Button
                                onClick={() => {
                                    setDiscount(0);
                                    setReason('');
                                }}
                                variant="outline"
                                disabled={isSubmitting || (!discount && !reason)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                                Clear Discount
                            </Button>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Updating...' : 'Apply Discount'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {currentDiscount ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Original Total:</span>
                                    <span>{formatPrice(originalTotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Discount Applied:</span>
                                    <span className="text-green-600">-{formatPrice(currentDiscount)}</span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-2 font-medium">
                                    <span>Total After Admin Discount:</span>
                                    <span>{formatPrice(finalTotal)}</span>
                                </div>
                                {currentReason && (
                                    <div className="mt-2 text-sm">
                                        <p className="font-medium">Reason:</p>
                                        <p className="text-gray-600">{currentReason}</p>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-2 pt-2">
                                    <Button
                                        onClick={handleRemoveDiscount}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Removing...' : 'Remove Discount'}
                                    </Button>
                                    <Button
                                        onClick={handleEditToggle}
                                        variant="outline"
                                        size="sm"
                                        disabled={isSubmitting}
                                    >
                                        Edit Discount
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                No discount has been applied to this order yet. Click &quot;Add Discount&quot; to apply a discount.
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
} 