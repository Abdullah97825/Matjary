import * as z from 'zod';
import { DiscountType } from '@prisma/client';

export const promoCodeSchema = z.object({
    code: z.string().min(1, 'Promo code is required'),
    description: z.string().optional().nullable(),
    discountType: z.nativeEnum(DiscountType),
    discountAmount: z.preprocess(
        (val) => (val === '' || val === undefined ? null : Number(val)),
        z.number().nullable().optional()
    ),
    discountPercent: z.preprocess(
        (val) => (val === '' || val === undefined ? null : Number(val)),
        z.number().min(0).max(100).nullable().optional()
    ),
    hasExpiryDate: z.boolean().default(true),
    expiryDate: z.date().nullable().optional(),
    isActive: z.boolean().default(true),
    maxUses: z.preprocess(
        (val) => (val === '' || val === undefined ? null : Number(val)),
        z.number().nullable().optional()
    ),
    minOrderAmount: z.preprocess(
        (val) => (val === '' || val === undefined ? null : Number(val)),
        z.number().nullable().optional()
    ),
    userAssignments: z.array(z.string()).default([]),
    excludedUserIds: z.array(z.string()).default([]),
});

export type PromoCodeFormData = z.infer<typeof promoCodeSchema>; 