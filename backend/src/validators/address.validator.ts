import { z } from 'zod';

export const createAddressSchema = z.object({
  receiverName: z
    .string({ required_error: 'Receiver name is required' })
    .min(2, 'Receiver name must be at least 2 characters')
    .max(100, 'Receiver name cannot exceed 100 characters'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .min(8, 'Phone number must be at least 8 digits')
    .max(15, 'Phone number cannot exceed 15 digits'),
  house: z
    .string({ required_error: 'House / Flat / Building details are required' })
    .min(1, 'House / Flat details are required')
    .max(200, 'House details cannot exceed 200 characters'),
  street: z
    .string({ required_error: 'Street / Area is required' })
    .min(2, 'Street / Area must be at least 2 characters')
    .max(300, 'Street details cannot exceed 300 characters'),
  landmark: z.string().max(200, 'Landmark cannot exceed 200 characters').optional().default(''),
  label: z.enum(['Home', 'Work', 'Other']).default('Home'),
  latitude: z
    .number({ required_error: 'Latitude coordinate is required' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number({ required_error: 'Longitude coordinate is required' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  formattedAddress: z.string().optional().default(''),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

