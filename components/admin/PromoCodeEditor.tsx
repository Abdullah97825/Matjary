'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/utils/format';
import { toast } from 'sonner';
import { orderService } from '@/services/order';
import { DiscountType } from '@prisma/client';

interface PromoCodeDetails {
    id: string;
    code: string;
    discountAmount: number;
    discountType: DiscountType;
    discountPercent?: number;
    discountValue?: number;
}

interface PromoCodeEditorProps {
    orderId: string;
    originalTotal: number;
    currentPromoCode: PromoCodeDetails | null;
    onPromoCodeApplied: () => void;
}

export function PromoCodeEditor({
    orderId,
    originalTotal,
    currentPromoCode = null,
    onPromoCodeApplied
}: PromoCodeEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            // Reset when starting to edit
            setPromoCode('');
            setError(null);
        }
    };

    const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPromoCode(e.target.value);
        if (error) setError(null);
    };

    const handleSubmit = async () => {
        if (!promoCode.trim()) {
            setError('Please enter a promo code');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            if (currentPromoCode) {
                // Use the dedicated endpoint for changing promo codes
                await orderService.changeOrderPromoCode(orderId, promoCode);
                toast.success('Promo code changed successfully');
            } else {
                // Apply a new promo code
                await orderService.applyOrderPromoCode(orderId, promoCode);
                toast.success('Promo code applied successfully');
            }

            setIsEditing(false);
            onPromoCodeApplied();
        } catch (error) {
            console.error('Error with promo code:', error);
            setError(error instanceof Error ? error.message : 'Failed to apply promo code');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemovePromoCode = async () => {
        setIsSubmitting(true);
        try {
            await orderService.removeOrderPromoCode(orderId);
            toast.success('Promo code removed successfully');
            onPromoCodeApplied();
        } catch (error) {
            console.error('Error removing promo code:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to remove promo code');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setPromoCode('');
        setError(null);
    };

    const finalTotal = currentPromoCode
        ? originalTotal - currentPromoCode.discountAmount
        : originalTotal;

    // Format discount description based on type
    const getDiscountDescription = () => {
        if (!currentPromoCode) return '';

        const amount = formatPrice(currentPromoCode.discountAmount);

        if (currentPromoCode.discountType === 'PERCENTAGE' && currentPromoCode.discountPercent) {
            return `${currentPromoCode.discountPercent}% (${amount})`;
        } else if (currentPromoCode.discountType === 'FLAT') {
            return amount;
        } else if (currentPromoCode.discountType === 'BOTH' && currentPromoCode.discountPercent) {
            return `${amount} (includes ${currentPromoCode.discountPercent}% discount)`;
        }

        return amount;
    };

    return (
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md">Promo Code</CardTitle>
                {!isEditing && !currentPromoCode && (
                    <Button
                        onClick={handleEditToggle}
                        variant="outline"
                        size="sm"
                    >
                        Add Promo Code
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="promo-code">Promo Code</Label>
                            <Input
                                id="promo-code"
                                value={promoCode}
                                onChange={handlePromoCodeChange}
                                placeholder="Enter promo code"
                                disabled={isSubmitting}
                            />
                            {error && (
                                <p className="text-sm text-red-500 mt-1">{error}</p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !promoCode.trim()}
                            >
                                {isSubmitting ? 'Applying...' : 'Apply Code'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {currentPromoCode ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Original Total:</span>
                                    <span>{formatPrice(originalTotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Promo Code:</span>
                                    <span className="font-medium text-green-600">{currentPromoCode.code}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Discount:</span>
                                    <span className="text-green-600">-{getDiscountDescription()}</span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-2 font-medium">
                                    <span>Total After Promo Discount:</span>
                                    <span>{formatPrice(finalTotal)}</span>
                                </div>

                                <div className="flex justify-end space-x-2 pt-2">
                                    <Button
                                        onClick={handleRemovePromoCode}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Removing...' : 'Remove Promo Code'}
                                    </Button>
                                    <Button
                                        onClick={handleEditToggle}
                                        variant="outline"
                                        size="sm"
                                        disabled={isSubmitting}
                                    >
                                        Change Promo Code
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                No promo code has been applied to this order yet. Click &quot;Add Promo Code&quot; to apply a discount code.
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
} 