import { z } from "zod";

type AuthValidationMessages = {
  email: string;
  passwordMin: string;
  nameMin: string;
  confirmPassword: string;
  passwordsMismatch: string;
};

export function createLoginSchema(messages: AuthValidationMessages) {
  return z.object({
    email: z.email(messages.email),
    password: z.string().min(8, messages.passwordMin),
  });
}

export function createRegisterSchema(messages: AuthValidationMessages) {
  return z
    .object({
      fullName: z.string().min(2, messages.nameMin),
      email: z.email(messages.email),
      password: z.string().min(8, messages.passwordMin),
      confirmPassword: z.string().min(8, messages.confirmPassword),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordsMismatch,
      path: ["confirmPassword"],
    });
}

export function createForgotPasswordSchema(
  messages: Pick<AuthValidationMessages, "email">,
) {
  return z.object({
    email: z.email(messages.email),
  });
}

export function createResetPasswordSchema(messages: AuthValidationMessages) {
  return z
    .object({
      password: z.string().min(8, messages.passwordMin),
      confirmPassword: z.string().min(8, messages.confirmPassword),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordsMismatch,
      path: ["confirmPassword"],
    });
}

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;
export type ForgotPasswordInput = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;
export type ResetPasswordInput = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;
