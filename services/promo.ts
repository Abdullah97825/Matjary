import {
    PromoCodeBase,
    PromoCodeCreate,
    PromoCodeUpdate,
    PromoCodeWithDetails,
    PromoCodeValidationResult,
    AppliedPromoCode
} from '@/types/promo';
import { PaginatedResponse } from '@/types/pagination';

export const promoService = {
    // Admin functions
    getAllPromoCodes: async (
        page: number = 1,
        perPage: number = 10,
        search: string = ''
    ): Promise<PaginatedResponse<PromoCodeWithDetails>> => {
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
        const response = await fetch(`/api/admin/promo-codes?page=${page}&per_page=${perPage}${searchParam}`);

        if (!response.ok) {
            throw new Error('Failed to fetch promo codes');
        }

        return response.json();
    },

    getPromoCode: async (id: string): Promise<PromoCodeWithDetails> => {
        const response = await fetch(`/api/admin/promo-codes/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch promo code');
        }
        return response.json();
    },

    createPromoCode: async (data: PromoCodeCreate): Promise<PromoCodeWithDetails> => {
        console.log('Service sending promo code data:', JSON.stringify(data, null, 2));

        const response = await fetch('/api/admin/promo-codes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(e => ({ message: 'Could not parse error response' }));
            console.error('Error response from create promo code API:', {
                status: response.status,
                statusText: response.statusText,
                data: errorData
            });
            throw new Error(errorData.message || 'Failed to create promo code');
        }

        return response.json();
    },

    updatePromoCode: async (data: PromoCodeUpdate): Promise<PromoCodeWithDetails> => {
        console.log('Service sending promo code update data:', JSON.stringify(data, null, 2));

        const response = await fetch(`/api/admin/promo-codes/${data.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(e => ({ message: 'Could not parse error response' }));
            console.error('Error response from update promo code API:', {
                status: response.status,
                statusText: response.statusText,
                data: errorData
            });
            throw new Error(errorData.message || 'Failed to update promo code');
        }

        return response.json();
    },

    deletePromoCode: async (id: string): Promise<void> => {
        const response = await fetch(`/api/admin/promo-codes/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete promo code');
        }
    },

    // User assignment functions
    assignUserToPromoCode: async (promoCodeId: string, userId: string, isExclusive: boolean = false, expiryDate?: string): Promise<void> => {
        const response = await fetch(`/api/admin/promo-codes/${promoCodeId}/assign-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                isExclusive,
                hasExpiryDate: !!expiryDate,
                expiryDate
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to assign user to promo code');
        }
    },

    removeUserFromPromoCode: async (promoCodeId: string, userId: string): Promise<void> => {
        const response = await fetch(`/api/admin/promo-codes/${promoCodeId}/remove-user`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to remove user from promo code');
        }
    },

    excludeUserFromPromoCode: async (promoCodeId: string, userId: string): Promise<void> => {
        const response = await fetch(`/api/admin/promo-codes/${promoCodeId}/exclude-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to exclude user from promo code');
        }
    },

    removeExcludedUserFromPromoCode: async (promoCodeId: string, userId: string): Promise<void> => {
        const response = await fetch(`/api/admin/promo-codes/${promoCodeId}/remove-excluded-user`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to remove excluded user from promo code');
        }
    },

    // Customer functions
    validatePromoCode: async (code: string, orderId?: string): Promise<PromoCodeValidationResult> => {
        const url = new URL('/api/promo-codes/validate', window.location.origin);
        url.searchParams.append('code', code);
        if (orderId) {
            url.searchParams.append('orderId', orderId);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            const error = await response.json();
            return {
                isValid: false,
                message: error.message || 'Invalid promo code'
            };
        }

        return response.json();
    },

    applyPromoCode: async (code: string, orderId: string): Promise<AppliedPromoCode> => {
        const response = await fetch('/api/checkout/apply-promo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, orderId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to apply promo code');
        }

        return response.json();
    },

    removePromoCode: async (orderId: string): Promise<void> => {
        const response = await fetch('/api/checkout/remove-promo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to remove promo code');
        }
    },

    getPromoCodesForUser: async (): Promise<PromoCodeWithDetails[]> => {
        const response = await fetch('/api/promo-codes/user');
        if (!response.ok) {
            throw new Error('Failed to fetch user promo codes');
        }
        return response.json();
    }
}; 