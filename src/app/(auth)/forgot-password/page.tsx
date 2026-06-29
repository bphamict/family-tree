import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { getTranslations } from "@/lib/i18n/translator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("auth.forgotTitle") };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.forgotTitle")}</CardTitle>
        <CardDescription>{t("auth.forgotDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
