import * as z from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
});

// Form schema (includes confirmation field)
export const updatePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirmation: z.string()
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Passwords don't match",
  path: ["passwordConfirmation"],
});

// API schema (without confirmation field)
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordFormSchema>;
export type UpdatePasswordData = z.infer<typeof updatePasswordSchema>;