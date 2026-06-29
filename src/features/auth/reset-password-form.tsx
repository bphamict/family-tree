"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  createResetPasswordSchema,
  type ResetPasswordInput,
} from "@/features/auth/auth-schemas";
import { updatePassword } from "@/features/auth/auth-service";
import { getAuthValidationMessages } from "@/lib/i18n/validation-messages";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/lib/i18n/use-translator";

export function ResetPasswordForm() {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const validationMessages = useMemo(() => getAuthValidationMessages(t), [t]);
  const schema = useMemo(
    () => createResetPasswordSchema(validationMessages),
    [validationMessages],
  );

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(schema),
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

    toast.success(t("auth.passwordUpdated"));
    router.push("/dashboard");
    router.refresh();
  }

  if (hasSession === null) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        {t("auth.verifyingReset")}
      </p>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-muted-foreground text-sm">
          {t("auth.invalidResetLink")}
        </p>
        <Link
          href="/forgot-password"
          className="text-foreground text-sm font-medium hover:underline"
        >
          {t("auth.requestNewReset")}
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.newPassword")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
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
              <FormLabel>{t("auth.confirmNewPassword")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("auth.updating") : t("auth.updatePassword")}
        </Button>
      </form>
    </Form>
  );
}
