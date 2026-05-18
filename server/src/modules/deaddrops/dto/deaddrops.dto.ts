
import { z } from 'zod';


/**
 * Schema for creating a new dead drop
 * All fields except password are required
 */
export const createDeadDropSchema = z.object({
  ciphertext: z.string().min(1, 'Encrypted message is required'),
  iv: z.string().min(1, 'Initialization vector is required'),
  salt: z.string().min(1, 'Salt is required'),
  hasPassword: z.boolean().default(false),
  password: z.string().optional(),
  expiryHours: z
    .number()
    .int()
    .min(1, 'Minimum expiry is 1 hour')
    .max(168, 'Maximum expiry is 7 days (168 hours)')
    .default(48),
});

/**
 * Schema for reading a dead drop (password verification)
 */
export const readDeadDropSchema = z.object({
  password: z.string().optional(),
});

/**
 * Type inferred from the create schema (for TypeScript usage)
 */
export type CreateDeadDropInput = z.infer<typeof createDeadDropSchema>;
export type ReadDeadDropInput = z.infer<typeof readDeadDropSchema>;