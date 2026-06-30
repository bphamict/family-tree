"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  createRegisterSchema,
  type RegisterInput,
} from "@/features/auth/auth-schemas";
import { signUpWithEmail } from "@/features/auth/auth-service";
import { AUTHENTICATED_HOME } from "@/lib/auth/routes";
import { getAuthValidationMessages } from "@/lib/i18n/validation-messages";
import { useTranslations } from "@/lib/i18n/use-translator";

export function RegisterForm() {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationMessages = useMemo(() => getAuthValidationMessages(t), [t]);
  const schema = useMemo(
    () => createRegisterSchema(validationMessages),
    [validationMessages],
  );

  const form = useForm<RegisterInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterInput) {
    setIsSubmitting(true);

    const { data, error } = await signUpWithEmail(values);

    if (error) {
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }

    if (data.session) {
      toast.success(t("auth.accountCreated"));
      router.push(AUTHENTICATED_HOME);
      router.refresh();
      return;
    }

    toast.success(t("auth.checkEmail"));
    router.push("/login");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("common.fullName")}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  placeholder={t("auth.namePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
              <FormLabel>{t("auth.password")}</FormLabel>
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
              <FormLabel>{t("auth.confirmPassword")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("auth.creatingAccount") : t("common.createAccount")}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          {t("auth.hasAccount")}{" "}
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
