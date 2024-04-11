import { z } from "zod";

export const SignUpSchema = z.object({
  email: z.string().email({ message: "invalid email" }),
  password: z
    .string()
    .min(6, { message: "password must be at least 6 characters" }),
  username: z
    .string()
    .min(3, { message: "username must be at least 3 characters" }),
});
export const LoginSchema = z.object({
  email: z.string().email({ message: "invalid email" }),
  password: z
    .string()
    .min(6, { message: "password must be at least 6 characters" }),
  username: z
    .string()
    .min(3, { message: "username must be at least 3 characters" }),
});
