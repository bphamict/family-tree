"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  createLoginSchema,
  type LoginInput,
} from "@/features/auth/auth-schemas";
import { signInWithEmail } from "@/features/auth/auth-service";
import { AUTHENTICATED_HOME } from "@/lib/auth/routes";
import { getAuthValidationMessages } from "@/lib/i18n/validation-messages";
import { useTranslations } from "@/lib/i18n/use-translator";

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTo = searchParams.get("redirect") ?? AUTHENTICATED_HOME;

  const validationMessages = useMemo(() => getAuthValidationMessages(t), [t]);
  const schema = useMemo(
    () => createLoginSchema(validationMessages),
    [validationMessages],
  );

  const form = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    setIsSubmitting(true);

    const { error } = await signInWithEmail(values);

    if (error) {
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success(t("auth.signedIn"));
    router.push(redirectTo);
    router.refresh();
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t("auth.password")}</FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("auth.signingIn") : t("common.signIn")}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          {t("auth.noAccount")}{" "}
          <Link
            href="/register"
            className="text-foreground font-medium hover:underline"
          >
            {t("auth.createOne")}
          </Link>
        </p>
      </form>
    </Form>
  );
}
