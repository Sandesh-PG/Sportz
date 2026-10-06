import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(100, 'name is too long'),
    email: z
      .string()
      .trim()
      .email('email must be valid')
      .max(255, 'email is too long')
      .transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(8, 'password must be at least 8 characters')
      .max(128, 'password is too long'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('email must be valid')
      .max(255, 'email is too long')
      .transform((value) => value.toLowerCase()),
    password: z.string().min(1, 'password is required').max(128, 'password is too long'),
  })
  .strict();

  export const refreshTokenSchema = z
  .object({
    refreshToken: z
      .string()
      .min(1, 'refreshToken is required'),
  })
  .strict();
