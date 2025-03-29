import { Response } from "express";

import { ErrorResponse } from "@/infra/constants/user.constants";

// Métodos helper
export function isErrorResponse(response: any): response is ErrorResponse {
  return (response as ErrorResponse).errors !== undefined || typeof response === "string";
}

export function normalizeError(error: unknown): string[] {
  if (typeof error === "string") return [error];

  if (Array.isArray(error)) {
    return error.map((e) => (typeof e === "string" ? e : e.message));
  }

  if (typeof error === "object" && error !== null && "errors" in error) {
    const errObj = error as { errors: unknown };
    if (typeof errObj.errors === "string") return [errObj.errors];
    if (Array.isArray(errObj.errors)) {
      return errObj.errors.map((e) => (typeof e === "string" ? e : e.message));
    }
  }

  return ["Unknown error occurred"];
}

export function sendErrorResponse(res: Response, status: number, errors: string[]) {
  return res.status(status).json({
    errors,
    data: null,
  });
}

export function sendSuccessResponse<T>(res: Response, status: number, data: T) {
  return res.status(status).json({
    data,
    errors: [],
  });
}