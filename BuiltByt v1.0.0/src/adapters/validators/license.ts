import { z } from "zod";

import { LicenseType } from "@prisma/client";

export const CreateLicenseSchema = z.object({
  key: z.string().min(1),
  type: z.nativeEnum(LicenseType),
  userId: z.string().min(1),
  adminId: z.string().min(1),
  hwid: z.array(z.string()),
  requestLimit: z.number().optional(),
  validUntil: z.coerce.date(),
});

export const UpdateLicenseSchema = z.object({
  hwid: z.array(z.string()).optional(),
  requestLimit: z.number().optional(),
  validUntil: z.coerce.date().optional(),
});
