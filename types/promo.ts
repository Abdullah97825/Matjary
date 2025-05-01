import { DiscountType } from "@prisma/client";

export interface PromoCodeBase {
    code: string;
    description?: string;
    discountType: DiscountType;
    discountAmount?: number;
    discountPercent?: number;
    hasExpiryDate: boolean;
    expiryDate?: Date | string | null;
    isActive: boolean;
    maxUses?: number | null;
    minOrderAmount?: number | null;
}

export interface PromoCodeCreate extends PromoCodeBase {
    userAssignments?: PromoCodeUserAssignment[];
    excludedUserIds?: string[];
}

export interface PromoCodeUpdate extends Partial<PromoCodeBase> {
    id: string;
    userAssignments?: PromoCodeUserAssignment[];
    excludedUserIds?: string[];
}

export interface PromoCodeUserAssignment {
    userId: string;
    isExclusive: boolean;
    hasExpiryDate: boolean;
    expiryDate?: Date | string | null;
}

export interface PromoCodeWithDetails extends PromoCodeBase {
    id: string;
    createdAt: string;
    updatedAt: string;
    usedCount: number;
    userAssignments: {
        id: string;
        userId: string;
        isExclusive: boolean;
        hasExpiryDate: boolean;
        expiryDate?: string | null;
        assignedAt: string;
        usedAt?: string | null;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }[];
    excludedUsers: {
        userId: string;
        excludedAt: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }[];
}

export interface PromoCodeValidationResult {
    isValid: boolean;
    message?: string;
    code?: PromoCodeWithDetails;
    discount?: {
        type: DiscountType;
        amount?: number;
        percent?: number;
        total: number;
    };
}

export interface AppliedPromoCode {
    id: string;
    code: string;
    discountAmount: number;
} 