'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OrderDiscountSummaryProps {
    subtotal: number;
    adminDiscount: number;
    promoDiscount: number;
    finalTotal: number;
    promoCode?: string | null;
}

export function OrderDiscountSummary({
    subtotal,
    adminDiscount,
    promoDiscount,
    finalTotal,
    promoCode
}: OrderDiscountSummaryProps) {
    const hasDiscounts = adminDiscount > 0 || promoDiscount > 0;

    return (
        <Card className="bg-slate-50 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center">
                    Complete Order Summary
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 ml-2 text-slate-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>This is the single source of truth for all discounts and the final order total.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>

                    {hasDiscounts && (
                        <div className="border-t border-slate-200 mt-2 pt-2 space-y-2">
                            <p className="text-xs text-slate-500">Applied Discounts:</p>

                            {adminDiscount > 0 && (
                                <div className="flex justify-between items-center text-sm text-green-600 bg-green-50 p-2 rounded-md">
                                    <span>Admin Discount:</span>
                                    <span>-{formatPrice(adminDiscount)}</span>
                                </div>
                            )}

                            {promoDiscount > 0 && (
                                <div className="flex justify-between items-center text-sm text-green-600 bg-green-50 p-2 rounded-md">
                                    <span>Promo Discount {promoCode && `(${promoCode})`}:</span>
                                    <span>-{formatPrice(promoDiscount)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center font-bold text-base bg-white p-3 rounded-md border border-slate-200 shadow-sm mt-3">
                        <span>Final Total:</span>
                        <span className="text-lg">{formatPrice(finalTotal)}</span>
                    </div>

                    {hasDiscounts && (
                        <div className="text-xs text-slate-500 italic text-center mt-1">
                            Total savings: {formatPrice(subtotal - finalTotal)} ({Math.round(((subtotal - finalTotal) / subtotal) * 100)}% off)
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 