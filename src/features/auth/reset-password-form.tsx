"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/features/auth/auth-schemas";
import { updatePassword } from "@/features/auth/auth-service";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setHasSession(!!user);
    }

    void checkSession();
  }, []);

  async function onSubmit(values: ResetPasswordInput) {
    setIsSubmitting(true);

    const { error } = await updatePassword(values);

    if (error) {
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success("Password updated successfully");
    router.push("/dashboard");
    router.refresh();
  }

  if (hasSession === null) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        Verifying reset link...
      </p>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-muted-foreground text-sm">
          This reset link is invalid or has expired. Request a new one to
          continue.
        </p>
        <Link
          href="/forgot-password"
          className="text-foreground text-sm font-medium hover:underline"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update password"}
        </Button>
      </form>
    </Form>
  );
}
