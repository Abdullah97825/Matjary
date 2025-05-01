import { z } from "zod";
import { addressFormSchema } from "./address";

export const createOrderSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  addressId: z.string().optional(),
  newAddress: addressFormSchema.optional(),
  saveAddress: z.boolean().optional(),
  paymentMethod: z.enum(['CASH']) //Currently, we only have cash payment method
}).refine(data => data.addressId || data.newAddress, {
  message: "Either select an existing address or enter a new one"
});

export type CreateOrderData = z.infer<typeof createOrderSchema>; 