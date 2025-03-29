import { ZodIssue } from "zod";

export type Roles = "admin" | "user" | "guest" | "developer" | "owner";
export type ErrorResponse = {
  errors: ZodIssue[] | string[] | string;
  data: null;
};