import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { getTranslations } from "@/lib/i18n/translator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("auth.resetTitle") };
}

export default async function ResetPasswordPage() {
  const t = await getTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.resetTitle")}</CardTitle>
        <CardDescription>{t("auth.resetDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
