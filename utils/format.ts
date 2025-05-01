import { Address, AddressFormData } from '@/types/address';

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

/**
 * Alias for formatPrice to maintain consistent naming across the application
 * @param amount The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = formatPrice;

export function formatAddressToString(address: Address | AddressFormData): string {
  const parts = [
    address.neighbourhood,
    address.city,
    address.province,
    address.country,
    address.zipcode
  ].filter(Boolean);

  if (address.nearestLandmark) {
    parts.push(`(Near ${address.nearestLandmark})`);
  }

  return parts.join(', ');
} 