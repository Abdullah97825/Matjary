import { z } from "zod";
import { addressFormSchema } from "./address";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  address: addressFormSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  passwordConfirmation: z.string()
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Passwords don't match",
  path: ["passwordConfirmation"],
});

export type RegisterData = z.infer<typeof registerSchema>;