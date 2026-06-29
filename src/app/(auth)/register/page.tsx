import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/register-form";
import { getTranslations } from "@/lib/i18n/translator";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("auth.registerTitle") };
}

export default async function RegisterPage() {
  const t = await getTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.registerTitle")}</CardTitle>
        <CardDescription>{t("auth.registerDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
