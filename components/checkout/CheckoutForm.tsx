"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CART_UPDATED_EVENT } from '@/utils/events';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Address, AddressFormData } from '@/types/address';
import { AddressForm } from '@/components/checkout/AddressForm';
import { PaymentMethod } from '@/types/order';
import { SerializedCartItem } from '@/types/cart';
import { hasNegotiableOrHiddenPriceItems } from '@/utils/cart';
import { ValidatedPromoCode } from '@/components/checkout/PromoCodeInput';

interface CheckoutFormProps {
  user: {
    name: string;
    phone: string;
  };
  addresses: Address[];
  paymentMethod: PaymentMethod;
  items: SerializedCartItem[];
  validatedPromoCode?: ValidatedPromoCode | null;
}

export function CheckoutForm({
  user,
  addresses,
  paymentMethod,
  items,
  validatedPromoCode
}: CheckoutFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [addressType, setAddressType] = useState<'existing' | 'new'>(
    addresses.length > 0 ? 'existing' : 'new'
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find(a => a.isDefault)?.id || addresses[0]?.id || ''
  );
  const [newAddress, setNewAddress] = useState<AddressFormData | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);

  // Check if cart has negotiable or hidden price items
  const hasSpecialPriceItems = hasNegotiableOrHiddenPriceItems(items);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate that we have either a selected address or new address
      if (addressType === 'existing' && !selectedAddressId) {
        throw new Error('Please select an address');
      }
      if (addressType === 'new' && !newAddress) {
        throw new Error('Please fill in the new address');
      }

      const orderData = {
        addressId: addressType === 'existing' ? selectedAddressId : undefined,
        newAddress: addressType === 'new' ? newAddress : undefined,
        saveAddress: addressType === 'new' ? saveAddress : undefined,
        paymentMethod: hasSpecialPriceItems ? 'PENDING' : paymentMethod,
        requestDetails: hasSpecialPriceItems,
        promoCode: validatedPromoCode?.code,
        promoCodeId: validatedPromoCode?.id
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const { orderId } = await response.json();
      window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      router.push(`/orders/${orderId}`);
    } catch (error) {
      console.error('Error placing order:', error);
      // Add error handling UI here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Details</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={user.name}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              value={user.phone}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-4">
            {addresses.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Select Shipping Address</h3>
                <RadioGroup
                  value={addressType}
                  onValueChange={(v) => setAddressType(v as 'existing' | 'new')}
                  className="space-y-4"
                >
                  <div className="space-y-4">
                    <div className="space-y-4">
                      {addresses.map(address => (
                        <div key={address.id}>
                          <RadioGroupItem
                            value="existing"
                            id={address.id}
                            className="peer sr-only"
                            onClick={() => setSelectedAddressId(address.id)}
                          />
                          <label
                            htmlFor={address.id}
                            className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${addressType === 'existing' && selectedAddressId === address.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <div className="flex items-center h-5">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${addressType === 'existing' && selectedAddressId === address.id
                                ? 'border-primary'
                                : 'border-gray-300'
                                }`}>
                                {addressType === 'existing' && selectedAddressId === address.id && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </div>
                            </div>
                            <div className="space-y-1 flex-grow">
                              <div className="font-medium">
                                {[
                                  address.neighbourhood,
                                  address.city,
                                  address.province,
                                  address.country,
                                  address.zipcode
                                ].filter(Boolean).join(', ')}
                              </div>
                              {address.nearestLandmark && (
                                <div className="text-sm text-muted-foreground">
                                  Near {address.nearestLandmark}
                                </div>
                              )}
                              {address.isDefault && (
                                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  Default Address
                                </span>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>

                    <div>
                      <RadioGroupItem
                        value="new"
                        id="new-address"
                        className="peer sr-only"
                      />
                      <label
                        htmlFor="new-address"
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${addressType === 'new'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${addressType === 'new'
                            ? 'border-primary'
                            : 'border-gray-300'
                            }`}>
                            {addressType === 'new' && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <span className="font-medium">Add a new address</span>
                        </div>
                        {addressType === 'new' && (
                          <AddressForm
                            onSubmit={setNewAddress}
                            showSaveOption
                            onSaveOptionChange={setSaveAddress}
                            standalone={false}
                          />
                        )}
                      </label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {addresses.length === 0 && (
              <AddressForm
                onSubmit={setNewAddress}
                showSaveOption
                onSaveOptionChange={setSaveAddress}
                standalone={false}
              />
            )}
          </div>

          {/* Only show payment method if there are no special price items */}
          {!hasSpecialPriceItems && (
            <div className="space-y-4">
              <h3 className="font-medium">Payment Method</h3>
              <RadioGroup value="CASH" disabled className="space-y-4">
                <div>
                  <RadioGroupItem
                    value="CASH"
                    id="payment-cash"
                    className="peer sr-only"
                  />
                  <label
                    htmlFor="payment-cash"
                    className="flex items-center space-x-3 p-4 border-2 rounded-lg border-primary bg-primary/5"
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium">Cash on Delivery</div>
                      <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Show info message when there are special price items */}
          {hasSpecialPriceItems && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Special Pricing Items</h3>
              <p className="text-sm text-blue-700">
                Your cart contains items with negotiable prices or items that require a price quote.
                After requesting details, we&apos;ll prepare a custom quote and pricing for your review.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || (addressType === 'new' && !newAddress)}
          >
            {hasSpecialPriceItems ? 'Request Details' : 'Place Order'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 
