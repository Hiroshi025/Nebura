import z from "zod";

/**
 * Zod schema for user registration (sign up) validation.
 *
 * @property email - User's email address (must be valid).
 * @property password - User's password (minimum 6 characters).
 * @property name - User's display name (minimum 3 characters).
 *
 * @see https://zod.dev/
 */
export const AuthR = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3),
});

/**
 * Zod schema for user login validation.
 *
 * @property email - User's email address (must be valid).
 * @property password - User's password (minimum 6 characters).
 *
 * @see https://zod.dev/
 */
export const AuthL = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
