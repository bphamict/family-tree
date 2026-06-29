"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useMemo, useState } from "react";
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
  createForgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/features/auth/auth-schemas";
import { sendPasswordResetEmail } from "@/features/auth/auth-service";
import { getAuthValidationMessages } from "@/lib/i18n/validation-messages";
import { useTranslations } from "@/lib/i18n/use-translator";

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validationMessages = useMemo(() => getAuthValidationMessages(t), [t]);
  const schema = useMemo(
    () => createForgotPasswordSchema(validationMessages),
    [validationMessages],
  );

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(schema),
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
    toast.success(t("auth.resetEmailSentToast"));
    setIsSubmitting(false);
  }

  if (emailSent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-muted-foreground text-sm">
          {t("auth.resetEmailSent")}
        </p>
        <Link
          href="/login"
          className="text-foreground text-sm font-medium hover:underline"
        >
          {t("common.backToSignIn")}
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("common.email")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={t("auth.emailPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("common.sending") : t("auth.sendResetLink")}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          {t("auth.rememberPassword")}{" "}
          <Link
            href="/login"
            className="text-foreground font-medium hover:underline"
          >
            {t("common.signIn")}
          </Link>
        </p>
      </form>
    </Form>
  );
}
