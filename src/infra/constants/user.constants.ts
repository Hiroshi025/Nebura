import { z } from "zod";

export type Roles = "admin" | "user" | "guest" | "developer" | "owner";


export const AuthRegister = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3),
  discord: z.string().min(3),
});

export const AuthLogin = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * Tipos de errores comunes en autenticación
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

export type ErrorResponse = {
  error: AuthErrorType;
  message: string;
  details?: any; // Detalles adicionales (ej: errores de validación)
};