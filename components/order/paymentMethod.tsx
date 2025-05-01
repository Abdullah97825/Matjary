import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PaymentMethodProps {
    id?: string; // Optional unique ID for the radio button
    className?: string; // Optional class name for the container
}

export function PaymentMethod({ id = 'payment-cash', className = '' }: PaymentMethodProps) {
    return (
        <div className={`mb-4 ${className}`}>
            <h3 className="font-medium mb-3">Payment Method</h3>
            <RadioGroup value="CASH" disabled className="space-y-4">
                <div className="bg-gray-50 rounded-lg border border-gray-200">
                    <RadioGroupItem
                        value="CASH"
                        id={id}
                        className="peer sr-only"
                    />
                    <label
                        htmlFor={id}
                        className="flex items-center px-4 py-3 cursor-not-allowed"
                    >
                        <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center mr-3">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <div>
                            <div className="font-medium">Cash on Delivery</div>
                            <div className="text-sm text-gray-500">Pay when you receive your order</div>
                        </div>
                    </label>
                </div>
            </RadioGroup>
        </div>
    );
} 