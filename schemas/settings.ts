import { z } from 'zod';

export const updateSettingSchema = z.object({
    value: z.string()
});

export const orderPrefixSchema = z.object({
    value: z.string().min(1).max(10)
}); 