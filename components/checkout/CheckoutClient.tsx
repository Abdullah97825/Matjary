'use client';

import { useState } from 'react';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { ValidatedPromoCode } from '@/components/checkout/PromoCodeInput';
import { SerializedCartItem } from '@/types/cart';
import { Address } from '@/types/address';

interface CheckoutClientProps {
    user: {
        id: string;
        name: string;
        email: string;
        phone: string;
    };
    addresses: Address[];
    serializedItems: SerializedCartItem[];
    subtotal: number;
}

export function CheckoutClient({
    user,
    addresses,
    serializedItems,
    subtotal
}: CheckoutClientProps) {
    const [validatedPromoCode, setValidatedPromoCode] = useState<ValidatedPromoCode | null>(null);

    return (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
                <CheckoutForm
                    user={user}
                    addresses={addresses}
                    paymentMethod="CASH"
                    items={serializedItems}
                    validatedPromoCode={validatedPromoCode}
                />
            </div>

            <div className="lg:col-span-4">
                <OrderSummary
                    items={serializedItems}
                    subtotal={subtotal}
                    onPromoCodeValidated={setValidatedPromoCode}
                />
            </div>
        </div>
    );
} 