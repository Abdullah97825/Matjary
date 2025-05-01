import { DiscountType } from '@prisma/client';
import { formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { PromoCodeWithDetails } from '@/types/promo';

/**
 * Formats a promo code response for API endpoints
 */
export const formatPromoCodeResponse = (promoCode: any) => {
    return {
        ...promoCode,
        expiryDate: promoCode.expiryDate?.toISOString() || null,
        createdAt: promoCode.createdAt.toISOString(),
        updatedAt: promoCode.updatedAt.toISOString(),
        userAssignments: promoCode.userAssignments.map((ua: any) => ({
            ...ua,
            expiryDate: ua.expiryDate?.toISOString() || null,
            assignedAt: ua.assignedAt.toISOString(),
            usedAt: ua.usedAt?.toISOString() || null,
            user: {
                id: ua.user.id,
                name: ua.user.name,
                email: ua.user.email,
            },
        })),
        excludedUsers: promoCode.excludedUsers.map((eu: any) => ({
            userId: eu.userId,
            excludedAt: eu.excludedAt.toISOString(),
            user: {
                id: eu.user.id,
                name: eu.user.name,
                email: eu.user.email,
            },
        })),
    };
};

/**
 * Calculates the discount amount based on order total and promo code details
 */
export const calculateDiscount = (
    discountType: DiscountType,
    orderTotal: number,
    discountAmount?: number | null,
    discountPercent?: number | null
) => {
    let discountTotal = 0;
    const discountDetails: {
        type: DiscountType;
        total: number;
        amount?: number;
        percent?: number;
    } = {
        type: discountType,
        total: 0
    };

    if (discountType === DiscountType.FLAT && discountAmount) {
        discountTotal = Number(discountAmount);
        discountDetails.amount = Number(discountAmount);
    } else if (discountType === DiscountType.PERCENTAGE && discountPercent) {
        discountTotal = (orderTotal * discountPercent) / 100;
        discountDetails.percent = discountPercent;
    } else if (discountType === DiscountType.BOTH && discountAmount && discountPercent) {
        const percentDiscount = (orderTotal * discountPercent) / 100;
        discountTotal = Number(discountAmount) + percentDiscount;
        discountDetails.amount = Number(discountAmount);
        discountDetails.percent = discountPercent;
    }

    // Make sure discount doesn't exceed order total
    discountTotal = Math.min(discountTotal, orderTotal);
    discountDetails.total = discountTotal;

    return discountDetails;
};

/**
 * Formats the expiry date for display
 */
export const formatExpiryDate = (date: string | Date | null | undefined) => {
    if (!date) return 'No expiry';

    const expiryDate = date instanceof Date ? date : new Date(date);
    if (isNaN(expiryDate.getTime())) return 'Invalid date';

    return `${expiryDate.toLocaleDateString()} (${formatDistanceToNow(expiryDate, { addSuffix: true })})`;
};

/**
 * Determines the status of a promo code
 */
export const getPromoCodeStatus = (promoCode: PromoCodeWithDetails) => {
    if (!promoCode.isActive) {
        return 'inactive';
    }

    if (promoCode.hasExpiryDate && promoCode.expiryDate) {
        const expiryDate = new Date(promoCode.expiryDate);
        if (isPast(expiryDate)) {
            return 'expired';
        }
    }

    if (promoCode.maxUses !== null && promoCode.maxUses !== undefined && promoCode.usedCount >= promoCode.maxUses) {
        return 'maxed';
    }

    return 'active';
};

/**
 * Formats a discount for display
 */
export const formatDiscountDisplay = (
    discountType: DiscountType,
    discountAmount?: number | null,
    discountPercent?: number | null
) => {
    switch (discountType) {
        case DiscountType.FLAT:
            return discountAmount ? `$${discountAmount} off` : 'No discount';
        case DiscountType.PERCENTAGE:
            return discountPercent ? `${discountPercent}% off` : 'No discount';
        case DiscountType.BOTH:
            return discountAmount && discountPercent
                ? `$${discountAmount} + ${discountPercent}% off`
                : 'No discount';
        default:
            return 'No discount';
    }
}; 