"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/auth-schemas";
import { sendPasswordResetEmail } from "@/features/auth/auth-service";

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setIsSubmitting(true);

    const { error } = await sendPasswordResetEmail(values);

    if (error) {
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }

    setEmailSent(true);
    toast.success("Password reset email sent");
    setIsSubmitting(false);
  }

  if (emailSent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-muted-foreground text-sm">
          If an account exists for that email, you will receive a password reset
          link shortly.
        </p>
        <Link href="/login" className="text-foreground text-sm font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send reset link"}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          Remember your password?{" "}
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}
