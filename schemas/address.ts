import { z } from "zod";

export const addressFormSchema = z.object({
  country: z.string().min(2, "Country is required"),
  province: z.string().min(2, "Province is required"),
  city: z.string().min(2, "City is required"),
  neighbourhood: z.string().min(2, "Neighbourhood is required"),
  nearestLandmark: z.string().min(2, "Nearest landmark is required"),
  zipcode: z.string().min(3, "Zipcode is required"),
  isDefault: z.boolean().default(false)
});

export type AddressFormData = z.infer<typeof addressFormSchema>; 