import { createClient } from "@/lib/supabase/client";

import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./auth-schemas";

export async function signInWithEmail(input: LoginInput) {
  const supabase = createClient();

  return supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
}

export async function signUpWithEmail(input: RegisterInput) {
  const supabase = createClient();

  return supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
      },
    },
  });
}

export async function signOut() {
  const supabase = createClient();

  return supabase.auth.signOut();
}

export async function sendPasswordResetEmail(input: ForgotPasswordInput) {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;

  return supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo,
  });
}

export async function updatePassword(input: ResetPasswordInput) {
  const supabase = createClient();

  return supabase.auth.updateUser({
    password: input.password,
  });
}
