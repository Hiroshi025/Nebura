import { z } from "zod";

/**
 * Represents the roles that a user can have in the system.
 * 
 * - `admin`: A user with administrative privileges.
 * - `user`: A regular user with standard access.
 * - `guest`: A user with limited access, typically not authenticated.
 * - `developer`: A user with development-related privileges.
 * - `owner`: A user with ownership privileges, typically the highest level of access.
 */
export type Roles = "admin" | "user" | "guest" | "developer" | "owner";

/**
 * Schema for validating the data required for user registration.
 * 
 * Fields:
 * - `email`: A valid email address.
 * - `password`: A password with a minimum length of 6 characters.
 * - `name`: A name with a minimum length of 3 characters.
 */
export const AuthRegister = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3),
});

export type AuthRegisterType = z.infer<typeof AuthRegister>;

/**
 * Schema for validating the data required for user login.
 * 
 * Fields:
 * - `email`: A valid email address.
 * - `password`: A password with a minimum length of 6 characters.
 */
export const AuthLogin = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * Common types of authentication errors that can occur in the system.
 * 
 * - `VALIDATION_ERROR`: Indicates that the provided data failed validation.
 * - `USER_NOT_FOUND`: Indicates that the user does not exist in the system.
 * - `USER_EXISTS`: Indicates that the user already exists in the system.
 * - `INVALID_CREDENTIALS`: Indicates that the provided credentials are invalid.
 * - `MISSING_DATA`: Indicates that required data is missing.
 * - `ENCRYPTION_ERROR`: Indicates an error occurred during encryption or decryption.
 * - `DATABASE_ERROR`: Indicates an error occurred while interacting with the database.
 * - `INTERNAL_SERVER_ERROR`: Indicates an unexpected internal server error.
 */
export type AuthErrorType = 
  | "VALIDATION_ERROR"
  | "USER_NOT_FOUND"
  | "USER_EXISTS"
  | "INVALID_CREDENTIALS"
  | "MISSING_DATA"
  | "ENCRYPTION_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_SERVER_ERROR";

/**
 * Represents the structure of an error response returned by the system.
 * 
 * Fields:
 * - `error`: The type of authentication error (see {@link AuthErrorType}).
 * - `message`: A human-readable message describing the error.
 * - `details`: Optional additional details about the error (e.g., validation errors).
 */
export type ErrorResponse = {
  error: AuthErrorType;
  message: string;
  details?: any; // Additional details (e.g., validation errors)
};