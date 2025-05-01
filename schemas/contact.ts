import { ContactType } from "@/types/contact";
import { z } from "zod";

export const contactDetailSchema = z.object({
  type: z.nativeEnum(ContactType),
  value: z.string().min(1),
  label: z.string().optional(),
  isMain: z.boolean().default(false),
  order: z.number().default(0)
});

export const businessHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  isClosed: z.boolean().default(false)
});

export const branchSchema = z.object({
  name: z.string().min(1),
  isMain: z.boolean().default(false),
  address: z.string().optional(),
  mapEnabled: z.boolean().default(false),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  mapZoomLevel: z.number().min(1).max(20).default(14),
  contacts: z.array(contactDetailSchema),
  businessHours: z.array(businessHoursSchema),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
    order: z.number(),
    isEnabled: z.boolean()
  }))
});

export type BranchFormData = z.infer<typeof branchSchema>; 