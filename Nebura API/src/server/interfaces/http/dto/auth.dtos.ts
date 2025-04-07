import z from "zod";

export const AuthR = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3),
});

export const AuthL = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});