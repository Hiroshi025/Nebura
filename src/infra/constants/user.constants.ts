import { z, ZodIssue } from "zod";

export type Roles = "admin" | "user" | "guest" | "developer" | "owner";
export type ErrorResponse = {
  errors: ZodIssue[] | string[] | string;
  data: null;
};

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
