import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'shop_owner', 'delivery_partner', 'admin']).default('customer'),
  avatar: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      state: z.string().optional(),
    })
    .optional(),
  shopDetails: z
    .object({
      shopName: z.string().optional(),
      category: z.string().optional(),
      address: z.string().optional(),
      image: z.string().optional(),
    })
    .optional(),
  deliveryDetails: z
    .object({
      vehicleType: z.string().optional(),
      vehicleNumber: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['customer', 'shop_owner', 'delivery_partner', 'admin']).optional(),
});

export const updateAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  state: z.string().optional(),
});

export const updateShopDetailsSchema = z.object({
  shopName: z.string().min(1, 'Shop name cannot be empty').optional(),
  category: z.string().optional(),
  address: z.string().optional(),
  image: z.string().optional(),
  isOpen: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters').optional(),
  phone: z.string().min(8, 'Phone number must be at least 8 digits').optional(),
  avatar: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type UpdateShopDetailsInput = z.infer<typeof updateShopDetailsSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
