'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/format';

export interface ValidatedPromoCode {
    id: string;
    code: string;
    discountAmount: number;
    minOrderAmount?: number | null;
    discountPercent?: number | null;
}

interface PromoCodeInputProps {
    subtotal: number;
    onValidPromoCode: (promoCode: ValidatedPromoCode | null) => void;
    hasSpecialPriceItems?: boolean;
}

export function PromoCodeInput({
    subtotal,
    onValidPromoCode,
}: PromoCodeInputProps) {
    const [code, setCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validatedPromo, setValidatedPromo] = useState<ValidatedPromoCode | null>(null);
    const [error, setError] = useState<string | null>(null);

    const validatePromoCode = async () => {
        if (!code.trim()) {
            setError('Please enter a promo code');
            return;
        }

        setError(null);
        setIsValidating(true);

        try {
            // Call the API to validate the promo code
            const response = await fetch(`/api/promo-codes/validate?code=${encodeURIComponent(code)}&amount=${subtotal}`);

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Invalid promo code');
                setValidatedPromo(null);
                onValidPromoCode(null);
                return;
            }

            const data = await response.json();

            if (!data.isValid) {
                setError(data.message || 'Invalid promo code');
                setValidatedPromo(null);
                onValidPromoCode(null);
                return;
            }

            // Format the promo code data
            const validPromo: ValidatedPromoCode = {
                id: data.code.id,
                code: data.code.code,
                discountAmount: data.discount.total,
                minOrderAmount: data.code.minOrderAmount,
                discountPercent: data.code.discountPercent
            };

            setValidatedPromo(validPromo);
            onValidPromoCode(validPromo);
            toast.success('Promo code applied');
        } catch (error) {
            console.error('Error validating promo code:', error);
            setError('Failed to validate promo code');
            setValidatedPromo(null);
            onValidPromoCode(null);
        } finally {
            setIsValidating(false);
        }
    };

    const clearPromoCode = () => {
        setValidatedPromo(null);
        setCode('');
        setError(null);
        onValidPromoCode(null);
        toast.success('Promo code removed');
    };

    // If a promo code is validated and applied, show it with option to remove
    if (validatedPromo) {
        return (
            <div className="space-y-2">
                <Label>Promo Code</Label>
                <div className="flex items-center space-x-2 rounded-md border border-input p-2 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                        <div className="font-medium text-green-800">{validatedPromo.code}</div>
                        <div className="text-xs text-green-600">
                            Discount: {formatPrice(validatedPromo.discountAmount)}
                            {validatedPromo.minOrderAmount ? ` (Min. order: ${formatPrice(validatedPromo.minOrderAmount)})` : ''}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearPromoCode}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label htmlFor="promo-code">Promo Code (optional)</Label>
            <div className="flex space-x-2">
                <div className="flex-1">
                    <Input
                        id="promo-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Enter promo code"
                        disabled={isValidating}
                    />
                    {error && (
                        <p className="text-xs text-red-500 mt-1">{error}</p>
                    )}
                </div>
                <Button
                    onClick={validatePromoCode}
                    disabled={!code.trim() || isValidating}
                >
                    {isValidating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isValidating ? 'Validating...' : 'Apply'}
                </Button>
            </div>
        </div>
    );
} 