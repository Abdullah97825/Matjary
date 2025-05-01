import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { PromoCodeValidationResult } from '@/types/promo';
import { calculateDiscount, formatPromoCodeResponse } from '@/utils/promo';


export const validatePromoCode = async (
    code: string,
    userId: string,
    orderTotal: number,
    tx?: Prisma.TransactionClient
): Promise<PromoCodeValidationResult> => {
    // Use the transaction context if provided, otherwise use prisma
    const prismaClient = tx || prisma;

    // Find the promo code
    const promoCode = await prismaClient.promoCode.findUnique({
        where: {
            code,
            isActive: true
        },
        include: {
            userAssignments: {
                where: { userId },
                include: { user: true }
            },
            excludedUsers: {
                where: { userId },
                include: { user: true }
            },
            orders: {
                select: { id: true }
            }
        }
    });

    // Check if the promo code exists and is active
    if (!promoCode) {
        return {
            isValid: false,
            message: 'Invalid or inactive promo code'
        };
    }

    // Check if the code has an expiry date and it's expired
    if (promoCode.hasExpiryDate && promoCode.expiryDate && promoCode.expiryDate < new Date()) {
        return {
            isValid: false,
            message: 'This promo code has expired'
        };
    }

    // Check if the user is excluded from using this code
    if (promoCode.excludedUsers.length > 0) {
        return {
            isValid: false,
            message: 'You are not eligible to use this promo code'
        };
    }

    // Check if the code is exclusively assigned to other users
    const exclusiveAssignments = await prismaClient.userPromoCode.findMany({
        where: {
            promoCodeId: promoCode.id,
            isExclusive: true,
            userId: { not: userId }
        }
    });

    if (exclusiveAssignments.length > 0) {
        return {
            isValid: false,
            message: 'This promo code is exclusively reserved for specific users'
        };
    }

    // Check if the user has an assignment and if it's expired
    if (promoCode.userAssignments.length > 0) {
        const assignment = promoCode.userAssignments[0];
        if (assignment.hasExpiryDate && assignment.expiryDate && assignment.expiryDate < new Date()) {
            return {
                isValid: false,
                message: 'Your access to this promo code has expired'
            };
        }
    }

    // Check if the code has reached its maximum usage
    if (promoCode.maxUses !== null && promoCode.usedCount >= promoCode.maxUses) {
        return {
            isValid: false,
            message: 'This promo code has reached its maximum usage limit'
        };
    }

    // Check if the order meets the minimum amount requirement
    if (promoCode.minOrderAmount && orderTotal < Number(promoCode.minOrderAmount)) {
        return {
            isValid: false,
            message: `Order total must be at least ${Number(promoCode.minOrderAmount)} to use this promo code`
        };
    }

    // Calculate discount amount using the utility function
    const discountDetails = calculateDiscount(
        promoCode.discountType,
        orderTotal,
        promoCode.discountAmount !== null ? Number(promoCode.discountAmount) : null,
        promoCode.discountPercent !== null ? Number(promoCode.discountPercent) : null
    );

    return {
        isValid: true,
        code: formatPromoCodeResponse(promoCode),
        discount: discountDetails
    };
}; 